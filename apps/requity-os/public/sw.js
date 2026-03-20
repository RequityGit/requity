// ============================================
// Requity Portal — Service Worker
// ============================================
// Handles: caching, offline fallback, push notifications
// Cache version — bump this when you deploy updates
const CACHE_VERSION = 'requity-v3';

// Files to pre-cache on install (shell of the app)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
];

// ─── INSTALL ─────────────────────────────────
// Pre-caches core app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ─── ACTIVATE ────────────────────────────────
// Cleans up old caches when a new version deploys
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of all pages
  );
});

// ─── FETCH ───────────────────────────────────
// Strategy: Network-first with cache fallback
// - Tries network first (always fresh data for a finance app)
// - Falls back to cache if offline
// - Shows offline page if nothing is cached
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (form submissions, API calls, etc.)
  if (event.request.method !== 'GET') return;

  // Only handle same-origin requests. Cross-origin fetches (Google Fonts,
  // Supabase, Twilio, Sentry, etc.) must not be intercepted by the SW,
  // because the SW's fetch() is subject to CSP connect-src and will fail
  // for domains not listed there, causing Chrome to flag "broken HTTPS".
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching (streams can only be read once)
        const responseClone = response.clone();

        // Cache successful responses for static assets
        if (response.ok && isStaticAsset(url.pathname)) {
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────
// Handles incoming push messages (from Postmark or your backend)
self.addEventListener('push', (event) => {
  let data = { title: 'Requity Group', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',  // URL to open when notification is clicked
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── NOTIFICATION CLICK ──────────────────────
// Opens the relevant page when user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If portal is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes('portal.requitygroup.com') && 'focus' in client) {
            client.focus();
            return client.navigate(targetUrl);
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl);
      })
  );
});

// ─── HELPERS ─────────────────────────────────
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico)$/i.test(pathname);
}
