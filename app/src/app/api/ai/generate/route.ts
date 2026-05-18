import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'anthropic_api_key')
    .single()
  const val = data?.value as string
  return val?.replace(/"/g, '') || ''
}

async function updateTokenUsage(input: number, output: number) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
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
  try {
    const { imageUrls, sessionTitle, bookContext } = await req.json()

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const apiKey = await getAnthropicApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured. Go to Admin → Settings.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const imageContents: Anthropic.Messages.ImageBlockParam[] = []

    for (const url of imageUrls) {
      const { data, error } = await supabase.storage
        .from('temp-uploads')
        .download(url)

      if (error || !data) {
        return NextResponse.json({ error: `Failed to download image: ${url}` }, { status: 500 })
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      const base64 = buffer.toString('base64')
      const ext = url.split('.').pop()?.toLowerCase() || 'jpeg'
      const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg'

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

    const html = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.Messages.TextBlock).text)
      .join('')

    await updateTokenUsage(response.usage.input_tokens, response.usage.output_tokens)

    // Clean up uploaded images
    for (const url of imageUrls) {
      await supabase.storage.from('temp-uploads').remove([url])
    }

    return NextResponse.json({
      html,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
