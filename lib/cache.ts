/**
 * =========================================================
 * Advanced Caching Layer
 * =========================================================
 * Redis-based caching with intelligent invalidation
 */

// In-memory cache fallback when Redis is not available
class InMemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return JSON.stringify(item.value);
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    this.cache.set(key, {
      value: JSON.parse(value),
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter((k) => regex.test(k));
  }
}

// Initialize cache (Redis or in-memory fallback)
let cacheInstance: any;

async function getCache() {
  if (cacheInstance) return cacheInstance;

  // Try Upstash Redis first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      cacheInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('✅ Upstash Redis cache initialized');
      return cacheInstance;
    } catch (error) {
      console.warn('⚠️  Redis not available, using in-memory cache');
    }
  }

  // Fallback to in-memory
  cacheInstance = new InMemoryCache();
  return cacheInstance;
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Organization
  ORG_OVERVIEW: (orgId: string) => `org:${orgId}:overview`,
  ORG_MEMBERS: (orgId: string, page = 0) => `org:${orgId}:members:${page}`,
  ORG_SETTINGS: (orgId: string) => `org:${orgId}:settings`,

  // User
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_COMPLIANCE: (userId: string) => `user:${userId}:compliance`,
  USER_TASKS: (userId: string) => `user:${userId}:tasks`,
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,

  // Analytics
  ANALYTICS_COMPLIANCE: (orgId: string) => `analytics:${orgId}:compliance`,
  ANALYTICS_TEAM: (orgId: string) => `analytics:${orgId}:team`,
  ANALYTICS_TREND: (orgId: string) => `analytics:${orgId}:trend`,

  // Certificates
  CERTIFICATES_LIST: (orgId: string) => `certs:${orgId}:list`,
  CERTIFICATE_DETAIL: (certId: string) => `cert:${certId}`,

  // Search
  SEARCH_RESULTS: (orgId: string, query: string) => `search:${orgId}:${query}`,
};

/**
 * Get cached data or fetch and cache
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300, // 5 minutes default
): Promise<T> {
  const cache = await getCache();

  try {
    // Try to get from cache
    const cached = await cache.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.warn(`Cache get error for key ${key}:`, error);
  }

  // Fetch fresh data
  const data = await fetcher();

  try {
    // Store in cache
    await cache.set(key, JSON.stringify(data), ttl);
  } catch (error) {
    console.warn(`Cache set error for key ${key}:`, error);
  }

  return data;
}

/**
 * Set cache value
 */
export async function setCache(
  key: string,
  value: any,
  ttl = 300,
): Promise<void> {
  const cache = await getCache();

  try {
    await cache.set(key, JSON.stringify(value), ttl);
  } catch (error) {
    console.warn(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Invalidate single cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  const cache = await getCache();

  try {
    await cache.del(key);
  } catch (error) {
    console.warn(`Cache invalidation error for key ${key}:`, error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const cache = await getCache();

  try {
    const keys = await cache.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key: string) => cache.del(key)));
    }
  } catch (error) {
    console.warn(`Cache pattern invalidation error for ${pattern}:`, error);
  }
}

/**
 * Invalidate all cache keys related to an organization
 */
export async function invalidateOrgCache(orgId: string): Promise<void> {
  await Promise.all([
    invalidateCachePattern(`org:${orgId}:*`),
    invalidateCachePattern(`analytics:${orgId}:*`),
    invalidateCachePattern(`certs:${orgId}:*`),
    invalidateCachePattern(`search:${orgId}:*`),
  ]);
}

/**
 * Invalidate all cache keys related to a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCachePattern(`user:${userId}:*`);
}

/**
 * Cache warming - preload frequently accessed data
 */
export async function warmCache(
  orgId: string,
  fetchers: Record<string, () => Promise<any>>,
): Promise<void> {
  const promises = Object.entries(fetchers).map(async ([key, fetcher]) => {
    try {
      const data = await fetcher();
      await setCache(key, data, 600); // 10 minutes for warmed cache
    } catch (error) {
      console.warn(`Cache warming failed for ${key}:`, error);
    }
  });

  await Promise.all(promises);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  keys?: number;
  memory?: string;
}> {
  const cache = await getCache();

  if (cache instanceof InMemoryCache) {
    return {
      type: 'memory',
      keys: (cache as any).cache.size,
    };
  }

  try {
    const info = await cache.info('memory');
    return {
      type: 'redis',
      memory: info.match(/used_memory_human:(.+)/)?.[1] || 'unknown',
    };
  } catch {
    return { type: 'redis' };
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  const cache = await getCache();

  if (cache instanceof InMemoryCache) {
    (cache as any).cache.clear();
  } else {
    try {
      await cache.flushdb();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
