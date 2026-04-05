/** @jest-environment node */

/**
 * Unit tests for lib/cache.ts
 *
 * Tests CacheKeys generators and the InMemoryCache fallback
 * behavior (getCached, setCache, invalidateCache, etc.)
 * without requiring Redis.
 */

import { CacheKeys } from '@/lib/cache';

// -------------------------------------------------------------------------
// CacheKeys generators
// -------------------------------------------------------------------------

describe('CacheKeys', () => {
  describe('ORG_OVERVIEW', () => {
    it('generates org overview key', () => {
      expect(CacheKeys.ORG_OVERVIEW('org-123')).toBe('org:org-123:overview');
    });
  });

  describe('ORG_MEMBERS', () => {
    it('generates org members key with default page', () => {
      expect(CacheKeys.ORG_MEMBERS('org-123')).toBe('org:org-123:members:0');
    });

    it('generates org members key with specific page', () => {
      expect(CacheKeys.ORG_MEMBERS('org-123', 3)).toBe('org:org-123:members:3');
    });
  });

  describe('ORG_SETTINGS', () => {
    it('generates org settings key', () => {
      expect(CacheKeys.ORG_SETTINGS('org-123')).toBe('org:org-123:settings');
    });
  });

  describe('USER_PROFILE', () => {
    it('generates user profile key', () => {
      expect(CacheKeys.USER_PROFILE('usr-456')).toBe('user:usr-456:profile');
    });
  });

  describe('USER_COMPLIANCE', () => {
    it('generates user compliance key', () => {
      expect(CacheKeys.USER_COMPLIANCE('usr-456')).toBe(
        'user:usr-456:compliance',
      );
    });
  });

  describe('USER_TASKS', () => {
    it('generates user tasks key', () => {
      expect(CacheKeys.USER_TASKS('usr-456')).toBe('user:usr-456:tasks');
    });
  });

  describe('USER_PERMISSIONS', () => {
    it('generates user permissions key', () => {
      expect(CacheKeys.USER_PERMISSIONS('usr-456')).toBe(
        'user:usr-456:permissions',
      );
    });
  });

  describe('ANALYTICS_COMPLIANCE', () => {
    it('generates analytics compliance key', () => {
      expect(CacheKeys.ANALYTICS_COMPLIANCE('org-123')).toBe(
        'analytics:org-123:compliance',
      );
    });
  });

  describe('ANALYTICS_TEAM', () => {
    it('generates analytics team key', () => {
      expect(CacheKeys.ANALYTICS_TEAM('org-123')).toBe(
        'analytics:org-123:team',
      );
    });
  });

  describe('ANALYTICS_TREND', () => {
    it('generates analytics trend key', () => {
      expect(CacheKeys.ANALYTICS_TREND('org-123')).toBe(
        'analytics:org-123:trend',
      );
    });
  });

  describe('CERTIFICATES_LIST', () => {
    it('generates certificates list key', () => {
      expect(CacheKeys.CERTIFICATES_LIST('org-123')).toBe('certs:org-123:list');
    });
  });

  describe('CERTIFICATE_DETAIL', () => {
    it('generates certificate detail key', () => {
      expect(CacheKeys.CERTIFICATE_DETAIL('cert-789')).toBe('cert:cert-789');
    });
  });

  describe('SEARCH_RESULTS', () => {
    it('generates search results key', () => {
      expect(CacheKeys.SEARCH_RESULTS('org-123', 'compliance')).toBe(
        'search:org-123:compliance',
      );
    });
  });

  describe('FRAMEWORKS_LIST', () => {
    it('generates frameworks list key', () => {
      expect(CacheKeys.FRAMEWORKS_LIST('org-123')).toBe(
        'frameworks:org-123:list',
      );
    });
  });

  describe('TASKS_OVERVIEW', () => {
    it('generates tasks overview key', () => {
      expect(CacheKeys.TASKS_OVERVIEW('org-123')).toBe(
        'tasks:org-123:overview',
      );
    });
  });

  describe('REPORTS_LIST', () => {
    it('generates reports list key', () => {
      expect(CacheKeys.REPORTS_LIST('org-123')).toBe('reports:org-123:list');
    });
  });
});

// -------------------------------------------------------------------------
// Caching functions — in-memory fallback (no Redis required)
// -------------------------------------------------------------------------

// The cache module inits once; ensure Redis is unavailable so
// it falls back to InMemoryCache.
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
  getRedisConfig: jest.fn(() => ({ restUrl: '', token: '' })),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  apiLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import {
  getCached,
  getCachedSWR,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  invalidateOrgCache,
  invalidateUserCache,
  warmCache,
  getCacheStats,
  clearAllCache,
} from '@/lib/cache';

describe('In-memory cache operations', () => {
  beforeEach(async () => {
    await clearAllCache();
  });

  describe('getCached', () => {
    it('calls fetcher on cache miss and returns result', async () => {
      const fetcher = jest.fn().mockResolvedValue({ items: [1, 2, 3] });
      const result = await getCached('test:key1', fetcher, 60);
      expect(result).toEqual({ items: [1, 2, 3] });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('returns cached data on cache hit', async () => {
      const fetcher = jest.fn().mockResolvedValue('first');
      await getCached('test:key2', fetcher, 60);

      const fetcher2 = jest.fn().mockResolvedValue('second');
      const result = await getCached('test:key2', fetcher2, 60);
      expect(result).toBe('first');
      expect(fetcher2).not.toHaveBeenCalled();
    });
  });

  describe('getCachedSWR', () => {
    it('returns stale data and revalidates in background', async () => {
      // Prime the cache
      await getCached('swr:key', () => Promise.resolve('stale'), 60);

      const result = await getCachedSWR(
        'swr:key',
        () => Promise.resolve('fresh'),
        60,
      );
      expect(result).toBe('stale'); // returns stale immediately
    });

    it('falls back to getCached when no stale data', async () => {
      const result = await getCachedSWR(
        'swr:miss',
        () => Promise.resolve('new'),
        60,
      );
      expect(result).toBe('new');
    });
  });

  describe('setCache', () => {
    it('stores value in cache', async () => {
      await setCache('manual:key', { foo: 'bar' }, 60);
      const result = await getCached(
        'manual:key',
        () => Promise.resolve('fallback'),
        60,
      );
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('invalidateCache', () => {
    it('removes single key', async () => {
      await setCache('del:key', 'value', 60);
      await invalidateCache('del:key');
      const fetcher = jest.fn().mockResolvedValue('refetched');
      const result = await getCached('del:key', fetcher, 60);
      expect(result).toBe('refetched');
    });
  });

  describe('invalidateCachePattern', () => {
    it('removes keys matching pattern', async () => {
      await setCache('org:abc:overview', 'v1', 60);
      await setCache('org:abc:settings', 'v2', 60);
      await setCache('org:xyz:overview', 'v3', 60);

      await invalidateCachePattern('org:abc:*');

      const f1 = jest.fn().mockResolvedValue('new1');
      const f2 = jest.fn().mockResolvedValue('new2');
      const f3 = jest.fn().mockResolvedValue('new3');

      expect(await getCached('org:abc:overview', f1, 60)).toBe('new1');
      expect(await getCached('org:abc:settings', f2, 60)).toBe('new2');
      expect(await getCached('org:xyz:overview', f3, 60)).toBe('v3'); // untouched
    });
  });

  describe('invalidateOrgCache', () => {
    it('invalidates all org-related keys', async () => {
      await setCache('org:o1:overview', 'v', 60);
      await setCache('analytics:o1:compliance', 'v', 60);
      await setCache('certs:o1:list', 'v', 60);
      await setCache('search:o1:query', 'v', 60);

      await invalidateOrgCache('o1');

      const f = jest.fn().mockResolvedValue('new');
      expect(await getCached('org:o1:overview', f, 60)).toBe('new');
      expect(await getCached('analytics:o1:compliance', f, 60)).toBe('new');
    });
  });

  describe('invalidateUserCache', () => {
    it('invalidates all user-related keys', async () => {
      await setCache('user:u1:profile', 'v', 60);
      await setCache('user:u1:tasks', 'v', 60);

      await invalidateUserCache('u1');

      const f = jest.fn().mockResolvedValue('new');
      expect(await getCached('user:u1:profile', f, 60)).toBe('new');
    });
  });

  describe('warmCache', () => {
    it('pre-populates cache from fetchers', async () => {
      await warmCache('org-1', {
        'warm:k1': () => Promise.resolve('val1'),
        'warm:k2': () => Promise.resolve('val2'),
      });

      const f = jest.fn();
      expect(await getCached('warm:k1', f, 60)).toBe('val1');
      expect(f).not.toHaveBeenCalled();
    });

    it('handles fetcher errors gracefully', async () => {
      await expect(
        warmCache('org-1', {
          'warm:err': () => Promise.reject(new Error('boom')),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    it('returns memory cache stats', async () => {
      const stats = await getCacheStats();
      expect(stats.type).toBe('memory');
      expect(typeof stats.keys).toBe('number');
    });
  });

  describe('clearAllCache', () => {
    it('clears all entries', async () => {
      await setCache('clear:k1', 'v1', 60);
      await clearAllCache();
      const f = jest.fn().mockResolvedValue('fresh');
      expect(await getCached('clear:k1', f, 60)).toBe('fresh');
    });
  });
});
