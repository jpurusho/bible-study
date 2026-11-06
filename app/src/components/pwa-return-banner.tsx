'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// Shown when the OAuth callback ran in regular Safari (not the installed PWA).
// On iOS < 16.4 the PWA and Safari have separate cookie jars, so the user
// needs to manually switch back to the home screen app icon.
export function PwaReturnBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('auth') !== 'done') return

    // Remove the ?auth=done param from the URL without a reload
    const next = new URL(window.location.href)
    next.searchParams.delete('auth')
    router.replace(next.pathname + (next.search || ''), { scroll: false })

    // Only show if the user is in a regular browser, not the installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari standalone flag
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (!isStandalone) setShow(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!show) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-start gap-3 bg-green-600 px-4 py-3 text-white shadow-lg sm:rounded-b-xl sm:inset-x-4">
      <svg className="mt-0.5 size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <div className="flex-1 text-sm leading-snug">
        <p className="font-semibold">Signed in successfully!</p>
        <p className="mt-0.5 opacity-90">
          To open the app, tap the <strong>Bible Study</strong> icon on your home screen.
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="ml-2 rounded p-1 opacity-75 hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
