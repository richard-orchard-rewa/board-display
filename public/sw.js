// Keeps the board showing something when the network drops: network-first for
// everything same-origin, falling back to the last good copy. API fallbacks are
// tagged so the page can tell stale data from fresh (see src/useApi.ts).
const CACHE = "board-display-v1"
const NETWORK_TIMEOUT_MS = 8000

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const stale = (res) => {
  const headers = new Headers(res.headers)
  headers.set("x-from-cache", "1")
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname === "/healthz") return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // Navigations all share one cached shell, whatever query string they carry.
      const key = request.mode === "navigate" ? "/" : request
      try {
        const res = await fetch(request, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) })
        if (res.ok) await cache.put(key, res.clone())
        return res
      } catch (err) {
        const hit = await cache.match(key)
        if (hit) return stale(hit)
        throw err
      }
    })(),
  )
})
