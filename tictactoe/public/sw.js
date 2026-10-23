/* Dragon Realm service worker — generated per site by scripts/sync-pwa.mjs (edit shared/pwa/sw.template.js).
 *  - Opens instantly and works offline after the first visit.
 *  - Pages: network first (always fresh when online), cached copy when offline.
 *  - Same-site files and Google Fonts: served from cache, refreshed in the background.
 *  - Account / database traffic (Supabase) is never touched or stored. */
const CACHE = 'realm-dragon-tictactoe-v1';
const MAX_ENTRIES = 120;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        // Cache the app shell AND the files it references, so even the very first reload works offline.
        const res = await fetch('/', { cache: 'reload' });
        const html = await res.clone().text();
        await cache.put('/', res);
        const files = new Set(
          [...html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:js|css|woff2?|png|jpe?g|webp|svg|webmanifest))"/g)].map((m) => m[1]),
        );
        await Promise.all([...files].map((u) => cache.add(u).catch(() => undefined)));
      } catch {
        /* offline during install — runtime caching will fill in */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('realm-dragon-tictactoe-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_ENTRIES) await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((k) => cache.delete(k)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(request, res.clone()).then(() => trim(cache));
      }
      return res;
    })
    .catch(() => cached);
  return cached || fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Pages (including SPA routes): network first, fall back to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/')) || Response.error()),
    );
    return;
  }

  if (url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // everything else (Supabase, analytics, …) goes straight to the network
});
