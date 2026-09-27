import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getEsvApiKey(): Promise<string> {
  if (process.env.ESV_API_KEY) return process.env.ESV_API_KEY
  try {
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'esv_api_key')
      .single()
    const val = data?.value as string
    return val?.replace(/"/g, '') || ''
  } catch {
    return ''
  }
}

async function getCachedVerse(reference: string, translation: string) {
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('scripture_cache')
    .select('content')
    .eq('reference', reference)
    .eq('translation', translation)
    .single()
  return data?.content || null
}

async function cacheVerse(reference: string, translation: string, content: string) {
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
  await supabase
    .from('scripture_cache')
    .upsert({ reference, translation, content }, { onConflict: 'reference,translation' })
}

export async function GET(req: NextRequest) {
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await authClient
    .from('profiles')
    .select('is_approved')
    .eq('id', user.id)
    .single()
  if (!profile?.is_approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: withinLimit } = await authClient.rpc('check_rate_limit', {
    limit_action: 'bible-lookup', max_requests: 60, window_seconds: 60,
  })
  if (!withinLimit) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const reference = req.nextUrl.searchParams.get('ref')?.trim()
  const translation = 'esv'

  if (!reference || reference.length > 100 || !/^[1-3A-Za-z .,:;\-–]+$/.test(reference)) {
    return NextResponse.json({ error: 'Valid ref parameter required' }, { status: 400 })
  }

  const cached = await getCachedVerse(reference, translation)
  if (cached) {
    return NextResponse.json({ text: cached, reference, translation: translation.toUpperCase() })
  }

  const apiKey = await getEsvApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'ESV API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false&indent-paragraphs=0`
    const res = await fetch(url, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    }
    const data = await res.json()
    const text = (data.passages?.[0] || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    }

    await cacheVerse(reference, translation, text)
    if (data.canonical && data.canonical !== reference) {
      await cacheVerse(data.canonical, translation, text)
    }

    return NextResponse.json({
      text,
      reference: data.canonical || reference,
      translation: 'ESV',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch verse' }, { status: 500 })
  }
}
