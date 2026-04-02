const CACHE_VERSION = 'formaos-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = ['/', '/offline', '/manifest.json'];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('formaos-') &&
                key !== STATIC_CACHE &&
                key !== API_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests — they go to background sync
  if (request.method !== 'GET') return;

  // API routes: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response('{"error":"offline"}', {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }),
          ),
        ),
    );
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ico)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Pages: network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response.ok &&
          request.headers.get('accept')?.includes('text/html')
        ) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match('/offline')),
      ),
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submission-sync') {
    event.waitUntil(syncPendingSubmissions());
  }
  if (event.tag === 'offline-action-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncPendingSubmissions() {
  // Open IndexedDB and replay queued form submissions
  const db = await openDB();
  const tx = db.transaction('pending_submissions', 'readonly');
  const store = tx.objectStore('pending_submissions');
  const submissions = await getAllFromStore(store);

  for (const sub of submissions) {
    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.data),
      });
      if (res.ok) {
        const delTx = db.transaction('pending_submissions', 'readwrite');
        delTx.objectStore('pending_submissions').delete(sub.id);
      }
    } catch {
      // Will retry on next sync
    }
  }
}

async function syncOfflineActions() {
  const db = await openDB();
  const tx = db.transaction('offline_actions', 'readonly');
  const store = tx.objectStore('offline_actions');
  const actions = await getAllFromStore(store);

  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) {
        const delTx = db.transaction('offline_actions', 'readwrite');
        delTx.objectStore('offline_actions').delete(action.id);
      }
    } catch {
      // Retry next sync
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('formaos-offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending_submissions')) {
        db.createObjectStore('pending_submissions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_actions')) {
        db.createObjectStore('offline_actions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entity_cache')) {
        db.createObjectStore('entity_cache', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'FormaOS', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: payload.tag ?? 'default',
      data: { url: payload.url ?? '/app' },
      actions: payload.actions ?? [],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client)
          return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
