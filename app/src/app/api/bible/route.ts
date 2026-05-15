import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getEsvApiKey(): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
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
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('scripture_cache')
    .select('content')
    .eq('reference', reference)
    .eq('translation', translation)
    .single()
  return data?.content || null
}

async function cacheVerse(reference: string, translation: string, content: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  await supabase
    .from('scripture_cache')
    .upsert({ reference, translation, content }, { onConflict: 'reference,translation' })
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('ref')
  const translation = req.nextUrl.searchParams.get('translation') || 'esv'

  if (!reference) {
    return NextResponse.json({ error: 'ref parameter required' }, { status: 400 })
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
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    }
    const data = await res.json()
    const text = (data.passages?.[0] || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    }

    await cacheVerse(data.canonical || reference, translation, text)

    return NextResponse.json({
      text,
      reference: data.canonical || reference,
      translation: 'ESV',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch verse' }, { status: 500 })
  }
}
