const CACHE_NAME = 'barber-app-v186'; // Bumped version to force SW update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// -----------------------------------------------------------------------
// CRITICAL FIX #1: Hardcoded absolute backend URL.
// The Service Worker has NO access to import.meta.env (it's plain JS).
// Using a relative '/api/booking' only works if the PWA domain itself
// has a reverse-proxy rule for /api/*. Using the absolute URL is safer
// and guarantees it always hits the backend, regardless of deployment.
// -----------------------------------------------------------------------
const API_BASE = 'https://api.glosscut.com';

// Install: Force waiting service worker to become active
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache opened');
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
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// -----------------------------------------------------------------------
// IDB HELPERS for Service Worker
// CRITICAL FIX #2: Added 'onupgradeneeded' handler.
// Without this, if the SW opens the IDB before the app has ever run
// initDB(), the object store does NOT exist and ALL getItem() calls
// silently return undefined — meaning barber_id and auth_token are
// always undefined, causing 404 and 401 errors on the booking API.
// -----------------------------------------------------------------------
const DB_NAME = 'BarberAppDB';
const STORE_NAME = 'NotificationStore';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    // THIS WAS THE MISSING PIECE — creates the store if it doesn't exist yet
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('[SW] IDB store created:', STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('[SW] IDB open error:', request.error);
      reject(request.error);
    };
  });
}

async function getItem(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[SW] getItem error for key:', key, err);
    return null;
  }
}

async function setItem(key, value) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[SW] setItem error for key:', key, err);
  }
}

// -----------------------------------------------------------------------
// STICKY NOTIFICATION — shown permanently in the notification tray so
// the barber can tap a service to instantly add a walk-in booking.
// -----------------------------------------------------------------------
async function showStickyNotification() {
  const pinnedServices = await getItem('pinned_services') || [];
  if (pinnedServices.length === 0) {
    console.log('[SW] No pinned services, skipping sticky notification.');
    return;
  }

  // Max 4 actions allowed by browser spec — already enforced on the settings page
  const actions = pinnedServices.map(s => ({
    action: `QUICK_ADD_${s._id}`,
    title: `➕ ${s.name}`
  }));

  const options = {
    body: 'Tap a service below to instantly add a walk-in booking.',
    icon: '/GlossCutQr.png',
    badge: '/ic_stat_notification_icon.png',
    tag: 'sticky_quick_actions',
    requireInteraction: true,
    renotify: false,
    actions: actions,
    data: { url: '/walk-in' }
  };

  return self.registration.showNotification('⚡ Quick Add Walk-in', options);
}

// Listen for messages from the app to refresh the sticky notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_STICKY_NOTIFICATION') {
    event.waitUntil(showStickyNotification());
  }
});

// -----------------------------------------------------------------------
// FETCH: Network First strategy — always try network, fall back to cache
// -----------------------------------------------------------------------
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
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

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// -----------------------------------------------------------------------
// WEB PUSH — incoming push notification from backend
// -----------------------------------------------------------------------
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
    data: { url: data.url || '/queue' },
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    tag: data.tag || 'booking_new'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// -----------------------------------------------------------------------
// CORE FUNCTION: handleQuickAdd
//
// Called when the barber taps a service button in the sticky notification.
// Creates a walk-in booking directly in the background — no app open needed.
//
// FIXES APPLIED:
// #1 — Uses absolute API_BASE URL (not relative '/api/booking')
// #2 — getDB() now has onupgradeneeded so barber_id/auth_token are found
// #3 — Auth token read from IDB (synced by AuthContext on every app load)
// #4 — customerPhone set to a valid placeholder that passes schema
// #5 — Service _id stored as string to avoid ObjectId serialization issues
// -----------------------------------------------------------------------
async function handleQuickAdd(action, notification) {
  const serviceId = action.replace('QUICK_ADD_', '');

  // Read everything needed from IDB
  const token = await getItem('auth_token');
  const barberId = await getItem('barber_id');
  const pinnedServices = await getItem('pinned_services') || [];

  // -----------------------------------------------------------------------
  // ROBUST ID MATCHING:
  // Tries to find the service by checking s._id, s.serviceId, and s.id
  // -----------------------------------------------------------------------
  const service = pinnedServices.find(s => {
    const sId = String(s._id || s.serviceId || s.id || '');
    return sId === String(serviceId);
  });

  console.log('[SW] Quick Add triggered:', { serviceId, barberId: !!barberId, token: !!token, service: !!service });

  // -----------------------------------------------------------------------
  // GUARD: If essential data is missing, open the walk-in page instead
  // of failing silently. This surfaces the issue clearly.
  // -----------------------------------------------------------------------
  if (!token) {
    console.warn('[SW] No auth token in IDB — opening app for manual login');
    await self.registration.showNotification('Please Re-open the App', {
      body: 'Session expired. Open the app once to refresh your login, then try again.',
      icon: '/GlossCutQr.png',
      tag: 'auth_needed',
      renotify: true
    });
    return clients.openWindow('/walk-in');
  }

  if (!barberId) {
    console.warn('[SW] No barber_id in IDB — opening walk-in page');
    return clients.openWindow('/walk-in');
  }

  if (!service) {
    console.warn('[SW] Service not found in pinned_services for id:', serviceId);
    await self.registration.showNotification('Service Not Found', {
      body: 'Could not find the selected service. Please re-pin your services in Settings.',
      icon: '/GlossCutQr.png',
      tag: 'service_error',
      renotify: true
    });
    return;
  }

  try {
    // Build date and time strings in local timezone (NOT UTC to avoid midnight mismatch)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`; // HH:MM — matches schema pattern ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$

    // -----------------------------------------------------------------------
    // BOOKING PAYLOAD
    // Mirrors exactly what the OfflineBookingScreen sends for a walk-in.
    // - customerName: "Walk-in" is standard and same as the walk-in page default
    // - customerPhone: "9999999999" is a dummy but passes the optional field
    // - appointmentType: Always 'Basic' as requested
    // - isOfflineBooking: true — this is a walk-in, no OTP needed
    // - service._id stored as string to avoid ObjectId serialization issues
    // -----------------------------------------------------------------------
    const payload = {
      barberId: String(barberId),
      date: dateStr,
      time: timeStr,
      services: [{
        _id: String(service._id),
        name: service.name,
        price: Number(service.price) || 0,
        time: Number(service.time) || 30,
        duration: Number(service.time) || 30
      }],
      totalPrice: Number(service.price) || 0,
      appointmentType: 'Basic',
      isOfflineBooking: true,
      customerName: 'Walk-in',
      customerPhone: '9999999999' // Placeholder — schema allows any string, just needs to be present
    };

    console.log('[SW] Sending booking payload:', JSON.stringify(payload));

    // -----------------------------------------------------------------------
    // CRITICAL FIX #1: Use absolute API_BASE URL, not relative '/api/booking'
    // This is the PRIMARY reason bookings were failing on deployed PWA.
    // -----------------------------------------------------------------------
    const response = await fetch(`${API_BASE}/api/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // Parse response regardless of status to get the error message if any
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      console.error('[SW] Could not parse response JSON');
    }

    if (response.ok) {
      console.log('[SW] Booking created successfully:', responseData._id || responseData.booking?._id);

      // Show clear success notification
      await self.registration.showNotification('✅ Walk-in Added!', {
        body: `${service.name} (₹${service.price}) added to your queue as a walk-in.`,
        icon: '/GlossCutQr.png',
        tag: 'booking_success',
        renotify: true,
        vibrate: [200, 100, 200]
      });

      // Restore the sticky notification tray so it's ready for the next walk-in
      await showStickyNotification();

      // Notify any open app windows to refresh their queue view
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        try {
          client.postMessage({ type: 'QUEUE_REFRESH_NEEDED' });
        } catch (e) {
          // Window may have been closed — ignore
        }
      }

    } else {
      // Log exact error from backend for debugging
      const errorMsg = responseData.msg || responseData.message || `HTTP ${response.status}`;
      console.error('[SW] Booking API error:', response.status, errorMsg);

      // Show specific error message to help diagnose
      let userFacingError = 'Could not add walk-in.';
      if (response.status === 401) {
        userFacingError = 'Session expired. Open the app to refresh login.';
      } else if (response.status === 400) {
        userFacingError = `Validation error: ${errorMsg}`;
      } else if (response.status === 404) {
        userFacingError = 'Barber profile not found. Please re-login.';
      } else if (errorMsg === 'Fully booked') {
        userFacingError = 'Your queue is full for today.';
      } else if (errorMsg) {
        userFacingError = errorMsg;
      }

      await self.registration.showNotification('⚠️ Could Not Add Walk-in', {
        body: userFacingError,
        icon: '/GlossCutQr.png',
        tag: 'booking_error',
        renotify: true,
        // Show action to open app manually
        actions: [{ action: 'OPEN_WALKIN', title: '📋 Open Walk-in Page' }],
        data: { url: '/walk-in' }
      });
    }
  } catch (err) {
    // Network failure or unexpected crash
    console.error('[SW] Quick Add network/crash error:', err.message || err);

    await self.registration.showNotification('⚠️ Network Error', {
      body: 'No internet connection. Open the app to add walk-in manually.',
      icon: '/GlossCutQr.png',
      tag: 'booking_error',
      renotify: true,
      actions: [{ action: 'OPEN_WALKIN', title: '📋 Open Walk-in Page' }],
      data: { url: '/walk-in' }
    });
  }
}

// -----------------------------------------------------------------------
// NOTIFICATION CLICK HANDLER
// -----------------------------------------------------------------------
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  // Service quick-add button tapped
  if (action && action.startsWith('QUICK_ADD_')) {
    event.waitUntil(handleQuickAdd(action, event.notification));
    return;
  }

  // "Open Walk-in Page" action button on error notifications
  if (action === 'OPEN_WALKIN') {
    event.waitUntil(clients.openWindow('/walk-in'));
    return;
  }

  // Default: focus/open the app at the URL specified in notification data
  const targetUrl = notificationData.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const appOrigin = self.location.origin;
      const fullTargetUrl = new URL(targetUrl, appOrigin).href;

      // If app is already open, navigate to the target URL
      for (const client of windowClients) {
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(fullTargetUrl).then(() => client.focus());
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(fullTargetUrl);
      }
    })
  );
});
