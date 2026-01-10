/**
 * FormaOS - Dashboard Cache Module
 * 
 * Simple TTL cache for expensive dashboard queries.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export const DEFAULT_CACHE_TTL_MS = 30 * 1000;

export function getFromCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setCache<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCache(key: string): void {
  cacheStore.delete(key);
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

export function clearCache(): void {
  cacheStore.clear();
}

export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key);
    }
  }
  
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

export async function cacheOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<T> {
  const cached = getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await compute();
  setCache(key, data, ttlMs);
  
  return data;
}

export function createCacheKey(...parts: (string | number)[]): string {
  return parts.map(p => String(p)).join(":");
}

export const DASHBOARD_CACHE_KEYS = {
  complianceSummary: (orgId: string) => createCacheKey("dashboard", "compliance", orgId),
  auditLogs: (orgId: string) => createCacheKey("dashboard", "audit", orgId),
  tasks: (orgId: string) => createCacheKey("dashboard", "tasks", orgId),
  evidence: (orgId: string) => createCacheKey("dashboard", "evidence", orgId),
  stats: (orgId: string) => createCacheKey("dashboard", "stats", orgId),
  membership: (userId: string) => createCacheKey("user", "membership", userId),
};

export const ORG_CACHE_KEYS = {
  details: (orgId: string) => createCacheKey("org", "details", orgId),
  members: (orgId: string) => createCacheKey("org", "members", orgId),
  frameworks: (orgId: string) => createCacheKey("org", "frameworks", orgId),
};

export function cleanupCache(): number {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key);
      removed++;
    }
  }
  
  return removed;
}

