const CACHE_NAME = 'barber-app-v185';
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

// --- IDB HELPERS for Service Worker ---
const DB_NAME = 'BarberAppDB';
const STORE_NAME = 'NotificationStore';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getItem(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setItem(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function showStickyNotification() {
  const pinnedServices = await getItem('pinned_services') || [];
  if (pinnedServices.length === 0) return;

  const actions = pinnedServices.map(s => ({
    action: `QUICK_ADD_${s._id}`,
    title: `➕ ${s.name}`
  }));

  const options = {
    body: 'Tap to add a new walk-in appointment instantly.',
    icon: '/GlossCutQr.png',
    badge: '/ic_stat_notification_icon.png',
    tag: 'sticky_quick_actions',
    requireInteraction: true,
    renotify: false, // Don't buzz every time it's refreshed
    actions: actions,
    data: { url: '/walk-in' }
  };

  return self.registration.showNotification('Barber Quick Actions', options);
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_STICKY_NOTIFICATION') {
    event.waitUntil(showStickyNotification());
  }
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
    icon: '/GlossCutQr.png', 
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

async function handleQuickAdd(action, notification) {
  const serviceId = action.replace('QUICK_ADD_', '');
  const token = await getItem('auth_token');
  const pinnedServices = await getItem('pinned_services') || [];
  const service = pinnedServices.find(s => s._id === serviceId);

  if (!token || !service) {
    // If no token, we can't do background add - open the app
    return clients.openWindow('/walk-in');
  }

  try {
    // 1. Get current date/time
    const now = new Date();
    // Use local timezone date (YYYY-MM-DD) instead of UTC to avoid midnight mismatch
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // 2. We need barberId. We can try to decode it from token or just let the backend handle it if it uses the token's sub
    // But current API needs barberId in body based on my view of OfflineBookingScreen.
    // Let's assume we can fetch user profile first if needed, or better, store barberId in IDB during login.
    const barberId = await getItem('barber_id'); 

    const payload = {
      barberId: barberId,
      date: dateStr,
      time: timeStr,
      services: [{
        id: service._id,
        name: service.name,
        price: service.price,
        time: service.time || 30
      }],
      totalPrice: service.price,
      appointmentType: 'Basic',
      isOfflineBooking: true,
      customerName: `Walk-in (Quick Add)`,
      customerPhone: '0000000000' // Placeholder
    };

    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // 1. Show success message
      await self.registration.showNotification('Booking Confirmed!', {
        body: `${service.name} added successfully to your queue.`,
        icon: '/GlossCutQr.png',
        tag: 'booking_success',
        renotify: true
      });

      // 2. RESTORE the sticky notification tray so it stays available for the next use
      // This fulfills your request to never have to open the app.
      await showStickyNotification();
    } else {
      throw new Error('Failed to add booking');
    }
  } catch (err) {
    console.error("Quick Add Error:", err);
    await self.registration.showNotification('Booking Failed', {
      body: 'Could not add walk-in. Please open the app.',
      icon: '/GlossCutQr.png',
      tag: 'booking_error'
    });
  }
}

self.addEventListener('notificationclick', function (event) {
  // 1. Close the notification immediately for all clicks to provide feedback
  event.notification.close();

  if (event.action && event.action.startsWith('QUICK_ADD_')) {
    event.waitUntil(handleQuickAdd(event.action, event.notification));
    return;
  }

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
