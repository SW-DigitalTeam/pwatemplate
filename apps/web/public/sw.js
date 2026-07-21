/* Service worker: app-shell caching + offline fallback + queued-write safety.
 * Deliberately conservative: identifiable participant data is NEVER cached.
 * Offline WRITES are handled by the app layer (IndexedDB outbox with client_key
 * idempotency — see packages docs); the SW only handles navigation/shell. */
const CACHE = "sw-shell-v1";
const SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;                 // never cache mutations
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;         // never cache API data
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit ?? caches.match("/offline"))
      )
    );
    return;
  }
  // static assets: stale-while-revalidate
  if (url.origin === self.location.origin && /\.(js|css|woff2?|png|svg|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached ?? network;
      })
    );
  }
});
