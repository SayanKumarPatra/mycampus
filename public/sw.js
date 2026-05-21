const CACHE_NAME = 'mycampus-portal-v1';
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/screenshots/screenshot_narrow.png',
  '/screenshots/screenshot_wide.png',
  '/placeholder.txt'
];

// Install Event: Pre-cache basic static assets resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets individually');
      // Cache files individually so that if one asset fails, it does not brick the entire install process
      const cachePromises = PRE_CACHE_ASSETS.map((asset) => {
        return cache.add(asset)
          .then(() => console.log(`[Service Worker] Cached asset: ${asset}`))
          .catch((err) => {
            console.warn(`[Service Worker] Skipped caching non-critical asset: ${asset}. Error:`, err);
          });
      });
      return Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Purging legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate caching strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Exclude Firebase Firestore network API or non-GET requests from caching
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // SPA fallback: redirect navigation requests to index.html if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. Immediately return cached response if available
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Guard checking for valid responses before adding to cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Cross-origin or network offline:', err);
      });

      return cachedResponse || fetchPromise;
    })
  );
});
