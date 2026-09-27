// Recovery service worker: remove caches created by the former authenticated
// page cache, then unregister. The installed app remains available but behaves
// like the network-backed website instead of serving stale login data.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
    await self.registration.unregister()
    await self.clients.claim()

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    clients.forEach((client) => client.postMessage({ type: 'BIBLE_STUDY_SW_REMOVED' }))
  })())
})
