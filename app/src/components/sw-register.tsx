'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    const recoveryKey = 'bible-study-sw-recovered-v2'
    let alreadyRecovered = false
    try {
      alreadyRecovered = localStorage.getItem(recoveryKey) === 'true'
    } catch {
      // Storage can be unavailable in private browsing; recovery should continue.
    }

    if (alreadyRecovered) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      return
    }

    const wasControlled = Boolean(navigator.serviceWorker.controller)

    const reloadAfterCleanup = () => {
      try { localStorage.setItem(recoveryKey, 'true') } catch { /* optional marker */ }
      if (!wasControlled) return
      if (sessionStorage.getItem('sw-recovery-reloaded')) return
      sessionStorage.setItem('sw-recovery-reloaded', 'true')
      window.location.reload()
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BIBLE_STUDY_SW_REMOVED') reloadAfterCleanup()
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => console.error('Service worker recovery failed', error))

    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    }

    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])

  return null
}
