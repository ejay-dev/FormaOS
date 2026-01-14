/**
 * =========================================================
 * FormaOS Service Worker
 * =========================================================
 * Offline support and caching for PWA
 */

const CACHE_NAME = 'formaos-v1';
const OFFLINE_URL = '/offline';

// Files to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/dashboard',
  '/tasks',
  '/certificates',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    }),
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );

  // Take control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not successful
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'error'
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new response
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache GET requests for same origin
            if (
              request.method === 'GET' &&
              request.url.startsWith(self.location.origin)
            ) {
              cache.put(request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // If both cache and network fail, show offline page for navigation
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }

          // For other requests, return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    }),
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'sync-certificates') {
    event.waitUntil(syncCertificates());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pendingTasks', 'readonly');
    const store = tx.objectStore('pendingTasks');
    const pendingTasks = await store.getAll();

    // Sync each task
    for (const task of pendingTasks) {
      await fetch('/api/tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      // Remove from pending after successful sync
      const deleteTx = db.transaction('pendingTasks', 'readwrite');
      await deleteTx.objectStore('pendingTasks').delete(task.id);
    }

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

async function syncCertificates() {
  // Similar to syncTasks
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification from FormaOS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('FormaOS', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FormaOS', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('pendingTasks')) {
        db.createObjectStore('pendingTasks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pendingCertificates')) {
        db.createObjectStore('pendingCertificates', { keyPath: 'id' });
      }
    };
  });
}
