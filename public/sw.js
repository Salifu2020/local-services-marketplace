/**
 * Service Worker for caching route chunks and static assets
 * Improves offline experience and reduces load times
 */

const CACHE_NAME = 'expertnextdoor-v1';
const ROUTE_CACHE_NAME = 'expertnextdoor-routes-v1';
const STATIC_CACHE_NAME = 'expertnextdoor-static-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Remove old caches
            return (
              name !== CACHE_NAME &&
              name !== ROUTE_CACHE_NAME &&
              name !== STATIC_CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Take control of all pages
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle SPA routes - always serve index.html for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch('/index.html').catch(() => {
          // Fallback if network fails
          return new Response('SPA fallback', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          });
        });
      })
    );
    return;
  }

  // Handle route chunks (JS files)
  if (url.pathname.startsWith('/js/') && url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.open(ROUTE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(request)
            .then((response) => {
              // Only cache successful responses
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // If network fails, return a fallback
              return new Response(
                '// Service Worker: Network error',
                {
                  status: 408,
                  headers: { 'Content-Type': 'application/javascript' },
                }
              );
            });
        });
      })
    );
    return;
  }

  // Handle static assets (HTML, CSS, images)
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return offline fallback for HTML
              if (url.pathname.endsWith('.html')) {
                return caches.match('/index.html');
              }
            });
        });
      })
    );
    return;
  }

  // For API requests, try network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

