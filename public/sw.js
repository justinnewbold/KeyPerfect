// KeyPerfect Service Worker for Offline Support
//
// Two caching strategies, picked by what the request is for:
//
//   HTML / navigation  -> network-first, cache as the offline fallback.
//   Everything else    -> cache-first, revalidated in the background.
//
// The distinction is the whole point. This used to be cache-first for every
// same-origin GET, including the precached '/' and '/index.html'. Vite emits
// content-hashed asset filenames, so the HTML is the only file whose *content*
// changes between builds — and serving it from cache meant a returning visitor
// got the previous build's HTML, pointing at the previous build's assets. The
// background revalidate only helped the load *after* that one, so every deploy
// took two reloads to reach anyone who had opened the app before.
const CACHE_NAME = 'keyperfect-v16.0.0';
const DYNAMIC_CACHE = 'keyperfect-dynamic-v16.0.0';

// The app shell. Only the offline fallback needs precaching; the hashed
// assets arrive through the runtime cache as they are requested.
const STATIC_ASSETS = ['/index.html', '/manifest.json'];

const OFFLINE_FALLBACK = '/index.html';

/** Vite's content-hashed output. Immutable, so cache-first is always safe. */
function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/');
}

/** A document request: the navigation itself, or an explicit HTML fetch. */
function isHTMLRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Network-first. Used for HTML so a deploy is picked up on the next load
 * rather than the one after it. Falls back to the cached copy when offline.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, copy);
    }
    return response;
  } catch (err) {
    const cached = (await caches.match(request)) || (await caches.match(OFFLINE_FALLBACK));
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

/** Cache-first, revalidated in the background. */
async function cacheFirst(request, cacheName, event) {
  const cached = await caches.match(request);

  if (cached) {
    event.waitUntil(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response);
          }
        })
        .catch(() => {
          // A failed background refresh is not an error; the cached copy stands.
        })
    );
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      const cache = await caches.open(cacheName);
      // Not awaited: the response should not wait on the cache write.
      event.waitUntil(cache.put(request, copy));
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isHTMLRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed assets never change under their own name, so they can live in the
  // long-lived cache. Everything else goes to the dynamic one, which is
  // cleared on a version bump alongside it.
  event.respondWith(
    cacheFirst(request, isHashedAsset(url) ? CACHE_NAME : DYNAMIC_CACHE, event)
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
