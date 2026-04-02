const DB_NAME = 'formaos-offline';
const DB_VERSION = 1;
const CACHE_STORE = 'entity_cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export type EntityType =
  | 'tasks'
  | 'visits'
  | 'participants'
  | 'forms'
  | 'incidents'
  | 'evidence';

interface CacheEntry {
  key: string;
  entityType: EntityType;
  orgId: string;
  data: unknown;
  cachedAt: string;
}

function cacheKey(
  entityType: EntityType,
  orgId: string,
  entityId?: string,
): string {
  return entityId
    ? `${entityType}:${orgId}:${entityId}`
    : `${entityType}:${orgId}:list`;
}

/** Cache a list of entities for offline access. */
export async function cacheEntityList(
  entityType: EntityType,
  orgId: string,
  data: unknown[],
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  tx.objectStore(CACHE_STORE).put({
    key: cacheKey(entityType, orgId),
    entityType,
    orgId,
    data,
    cachedAt: new Date().toISOString(),
  } satisfies CacheEntry);
  await new Promise<void>((res) => {
    tx.oncomplete = () => res();
  });
}

/** Retrieve cached entity list. */
export async function getCachedEntities(
  entityType: EntityType,
  orgId: string,
): Promise<unknown[] | null> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readonly');
  const entry: CacheEntry | undefined = await new Promise((res, rej) => {
    const req = tx.objectStore(CACHE_STORE).get(cacheKey(entityType, orgId));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  return entry ? (entry.data as unknown[]) : null;
}

/** Cache a single entity detail. */
export async function cacheEntityDetail(
  entityType: EntityType,
  entityId: string,
  orgId: string,
  data: unknown,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  tx.objectStore(CACHE_STORE).put({
    key: cacheKey(entityType, orgId, entityId),
    entityType,
    orgId,
    data,
    cachedAt: new Date().toISOString(),
  } satisfies CacheEntry);
  await new Promise<void>((res) => {
    tx.oncomplete = () => res();
  });
}

/** Get when an entity type was last cached. */
export async function getLastSyncTime(
  entityType: EntityType,
  orgId: string,
): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readonly');
  const entry: CacheEntry | undefined = await new Promise((res, rej) => {
    const req = tx.objectStore(CACHE_STORE).get(cacheKey(entityType, orgId));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  return entry?.cachedAt ?? null;
}

/** Clear all cached data, optionally for a specific org. */
export async function clearCache(orgId?: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);

  if (!orgId) {
    store.clear();
  } else {
    const entries: CacheEntry[] = await new Promise((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    for (const entry of entries) {
      if (entry.orgId === orgId) store.delete(entry.key);
    }
  }
  await new Promise<void>((res) => {
    tx.oncomplete = () => res();
  });
}
