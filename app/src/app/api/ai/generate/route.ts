import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sanitizeContentHtml } from '@/lib/sanitize-content'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const SYSTEM_PROMPT = `You are a Bible study content formatter. You receive images of book pages from a Bible commentary or study guide. Your job is to transcribe and format the content into beautiful, well-structured HTML for a Bible study web application.

Format rules:
1. Use <h1> for the main session title (only one per output)
2. Use <h2> for major sections
3. Use <h3> for sub-sections
4. Use <blockquote><p>...</p></blockquote> for scripture quotes and notable quotes from authors
5. Use <strong> for key terms and important phrases
6. Use <ul><li> for unordered bullet points
7. Use <ol><li> for numbered lists
8. Use <p> for regular paragraphs with generous content
9. Use <em> for scripture references inline (e.g., <em>Romans 8:31-39</em>)
10. Include discussion questions at the end under <h2>Discussion Questions</h2> as an <ol>

Style guidelines:
- Do NOT use dashes or hyphens to start bullet points in the output text
- Write in complete sentences, not fragments
- Preserve all scripture references exactly as written
- Preserve all author attributions and book citations
- Keep the theological depth and teaching points intact
- Make content engaging and readable for a church study group of ~30 people
- If pages contain an outline at the top, use it to structure the HTML sections
- Combine content from multiple pages into one cohesive document

Output ONLY the HTML content. No markdown, no code fences, no explanations.`

async function getAnthropicApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'anthropic_api_key')
    .single()
  const val = data?.value as string
  return val?.replace(/"/g, '') || ''
}

async function updateTokenUsage(input: number, output: number) {
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
  const { data: existing } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ai_usage')
    .single()

  const current = (existing?.value as { input: number; output: number; scans: number }) || { input: 0, output: 0, scans: 0 }

  await supabase
    .from('app_settings')
    .upsert({
      key: 'ai_usage',
      value: {
        input: (current.input || 0) + input,
        output: (current.output || 0) + output,
        scans: (current.scans || 0) + 1,
      },
      updated_at: new Date().toISOString(),
    })
}

export async function POST(req: NextRequest) {
  let uploadedPaths: string[] = []
  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data: withinLimit } = await authClient.rpc('check_rate_limit', {
      limit_action: 'ai-generate', max_requests: 5, window_seconds: 3600,
    })
    if (!withinLimit) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const { imageUrls, sessionTitle, bookContext } = await req.json()

    if (!Array.isArray(imageUrls) || imageUrls.length < 1 || imageUrls.length > 20) {
      return NextResponse.json({ error: 'Provide between 1 and 20 images' }, { status: 400 })
    }
    if (!imageUrls.every((path): path is string =>
      typeof path === 'string' && path.startsWith(`${user.id}/`) && !path.includes('..')
    )) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 })
    }
    if ((sessionTitle && typeof sessionTitle !== 'string') || sessionTitle?.length > 200 ||
        (bookContext && typeof bookContext !== 'string') || bookContext?.length > 500) {
      return NextResponse.json({ error: 'Invalid content context' }, { status: 400 })
    }
    uploadedPaths = imageUrls

    const apiKey = await getAnthropicApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured. Go to Admin → Settings.' }, { status: 500 })
    }

    const imageContents: Anthropic.Messages.ImageBlockParam[] = []
    let totalBytes = 0

    for (const url of imageUrls) {
      const { data, error } = await serviceClient.storage
        .from('temp-uploads')
        .download(url)

      if (error || !data) {
        return NextResponse.json({ error: 'Failed to read an uploaded image' }, { status: 400 })
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      totalBytes += buffer.byteLength
      if (buffer.byteLength > 5 * 1024 * 1024 || totalBytes > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Images exceed the upload size limit' }, { status: 413 })
      }
      const base64 = buffer.toString('base64')
      const mediaType = data.type === 'image/png' ? 'image/png' :
        data.type === 'image/jpeg' ? 'image/jpeg' : null
      if (!mediaType) {
        return NextResponse.json({ error: 'Only JPEG and PNG images are supported' }, { status: 415 })
      }

      imageContents.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      })
    }

    const userPrompt = `Please transcribe and format these ${imageUrls.length} page(s) into study notes HTML.${sessionTitle ? ` The session title is: "${sessionTitle}".` : ''}${bookContext ? ` Context: ${bookContext}` : ''}`

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    })

    const html = sanitizeContentHtml(response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.Messages.TextBlock).text)
      .join(''))

    await updateTokenUsage(response.usage.input_tokens, response.usage.output_tokens)

    return NextResponse.json({
      html,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    })
  } catch (err) {
    console.error('AI generation failed', err)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  } finally {
    if (uploadedPaths.length > 0) {
      await serviceClient.storage.from('temp-uploads').remove(uploadedPaths)
    }
  }
}
