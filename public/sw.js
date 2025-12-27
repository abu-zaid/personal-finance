// Minimal, safe service worker that won't break the app
const VERSION = '1.0.0';
const CACHE_NAME = `finance-v${VERSION}`;

console.log('[SW] Service Worker Version:', VERSION);

// Install event - just skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', VERSION);
  self.skipWaiting();
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - just pass through, don't intercept
self.addEventListener('fetch', (event) => {
  // Let all requests pass through to the network
  // This ensures the app works normally
  return;
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
