const CACHE_NAME = 'barber-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Force waiting service worker to become active
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate: Clean up old caches and claim clients immediately
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch: Network First strategy for robust updates
// If network fails, fall back to cache.
self.addEventListener('fetch', event => {
  // Navigation requests -> Network First, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with latest version
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other requests, use Network First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// --- WEB PUSH NOTIFICATIONS ---

self.addEventListener('push', function (event) {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Barber Notification';
  const options = {
    body: data.body || 'You have a new booking update.',
    icon: '/ic_stat_notification_icon.png', // Physical file is now the new logo
    badge: '/ic_stat_notification_icon.png',
    data: {
      url: data.url || '/queue'
    },
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    tag: data.tag || 'booking_new'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Focus on the app if it's already open, otherwise open a new window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Base origin explicitly resolves the URL to avoid Android PWA black-screen crashes
      const appUrl = new URL('/', self.location.origin).href;

      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === appUrl && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(appUrl);
      }
    })
  );
});
