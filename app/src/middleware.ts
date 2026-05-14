import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/login', '/pending', '/api/auth/callback', '/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
