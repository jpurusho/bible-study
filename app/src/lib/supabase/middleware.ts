import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // getUser() makes a network call to Supabase Auth and automatically uses
    // the refresh token to issue a new access token when the current one has
    // expired. getClaims() only reads the JWT locally and never refreshes —
    // sessions appeared to expire after ~1 hour even though the 60-day refresh
    // token was still valid. The setAll callback above writes the new tokens
    // back to the response cookies so the browser keeps the session alive.
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      // Distinguish a missing/invalid session (redirect to login) from a
      // transient network failure (let the request through so the server
      // component can retry, same as the authUnavailable path below).
      const isNetworkError =
        error.name !== 'AuthSessionMissingError' &&
        !('status' in error && (error as { status: number }).status === 401)
      if (isNetworkError) {
        console.error('Auth service temporarily unavailable', error)
        return { supabaseResponse, user: null, authUnavailable: true }
      }
      return { supabaseResponse, user: null, authUnavailable: false }
    }

    return {
      supabaseResponse,
      user: user ? { id: user.id } : null,
      authUnavailable: false,
    }
  } catch (error) {
    console.error('Authentication verification unavailable', error)
    return { supabaseResponse, user: null, authUnavailable: true }
  }
}
