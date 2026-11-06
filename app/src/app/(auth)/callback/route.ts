import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/safe-redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Tag the redirect so the client can detect it arrived from OAuth.
      // Used to show "return to app" guidance when the callback ran in a
      // regular browser tab rather than the installed PWA (iOS cookie isolation).
      const dest = new URL(`${origin}${redirectTo}`)
      dest.searchParams.set('auth', 'done')
      return NextResponse.redirect(dest.toString())
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
