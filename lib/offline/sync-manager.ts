const DB_NAME = 'formaos-offline';
const DB_VERSION = 1;
const ACTIONS_STORE = 'offline_actions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending_submissions')) {
        db.createObjectStore('pending_submissions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ACTIONS_STORE)) {
        db.createObjectStore(ACTIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entity_cache')) {
        db.createObjectStore('entity_cache', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface OfflineAction {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  queuedAt: string;
  entityType?: string;
  entityId?: string;
}

/** Queue an API request for replay when back online. */
export async function queueOfflineAction(
  action: Omit<OfflineAction, 'id' | 'queuedAt'>,
): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const record: OfflineAction = {
    ...action,
    id,
    queuedAt: new Date().toISOString(),
  };
  const tx = db.transaction(ACTIONS_STORE, 'readwrite');
  tx.objectStore(ACTIONS_STORE).put(record);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });

  // Request background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await (
      reg as unknown as { sync: { register: (tag: string) => Promise<void> } }
    ).sync.register('offline-action-sync');
  }

  return id;
}

/** Replay all queued actions when back online. */
export async function processPendingActions(): Promise<{
  succeeded: number;
  failed: number;
}> {
  const db = await openDB();
  const tx = db.transaction(ACTIONS_STORE, 'readonly');
  const store = tx.objectStore(ACTIONS_STORE);
  const actions: OfflineAction[] = await new Promise((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  let succeeded = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) {
        const delTx = db.transaction(ACTIONS_STORE, 'readwrite');
        delTx.objectStore(ACTIONS_STORE).delete(action.id);
        await new Promise<void>((r) => {
          delTx.oncomplete = () => r();
        });
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

/** Get offline status and pending action count. */
export async function getOfflineStatus(): Promise<{
  isOnline: boolean;
  pendingCount: number;
}> {
  const db = await openDB();
  const tx = db.transaction(ACTIONS_STORE, 'readonly');
  const store = tx.objectStore(ACTIONS_STORE);
  const count: number = await new Promise((res, rej) => {
    const req = store.count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  return { isOnline: navigator.onLine, pendingCount: count };
}
