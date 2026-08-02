/** @jest-environment node */

jest.mock('@/lib/observability/structured-logger', () => ({
  apiLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  getFromCache,
  setCache,
  invalidateCache,
  invalidateCacheByPrefix,
  clearCache,
  getCacheStats,
  cacheOrCompute,
  createCacheKey,
  cleanupCache,
  cacheWithFallback,
  cacheWithBackgroundRefresh,
  DASHBOARD_CACHE_KEYS,
  ORG_CACHE_KEYS,
} from '@/lib/cache/dashboard-cache';

describe('lib/cache/dashboard-cache', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('getFromCache / setCache', () => {
    it('returns null for missing keys', () => {
      expect(getFromCache('missing')).toBeNull();
    });

    it('stores and retrieves a value', () => {
      setCache('key1', { foo: 'bar' });
      expect(getFromCache('key1')).toEqual({ foo: 'bar' });
    });

    // Audit 2026-08-02: this used to accept `[null, 'data']` — either outcome
    // passed, so the TTL branch had no deterministic coverage. Fake timers
    // pin the clock so both sides of the expiry check are asserted.
    it('serves a zero-TTL entry in the same millisecond and drops it after', () => {
      jest.useFakeTimers();
      try {
        setCache('ttl-zero', 'data', 0);
        expect(getFromCache('ttl-zero')).toBe('data');
        jest.advanceTimersByTime(1);
        expect(getFromCache('ttl-zero')).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });

    it('expires an entry once its TTL has elapsed', () => {
      jest.useFakeTimers();
      try {
        setCache('ttl-short', 'data', 5000);
        jest.advanceTimersByTime(4999);
        expect(getFromCache('ttl-short')).toBe('data');
        jest.advanceTimersByTime(2);
        expect(getFromCache('ttl-short')).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });

    it('handles non-default TTL', () => {
      setCache('custom-ttl', 42, 60000);
      expect(getFromCache('custom-ttl')).toBe(42);
    });
  });

  describe('invalidateCache', () => {
    it('removes a specific key', () => {
      setCache('a', 1);
      setCache('b', 2);
      invalidateCache('a');
      expect(getFromCache('a')).toBeNull();
      expect(getFromCache('b')).toBe(2);
    });
  });

  describe('invalidateCacheByPrefix', () => {
    it('removes all keys matching prefix', () => {
      setCache('dashboard:org1:stats', 100);
      setCache('dashboard:org1:tasks', 200);
      setCache('user:u1', 300);
      invalidateCacheByPrefix('dashboard:');
      expect(getFromCache('dashboard:org1:stats')).toBeNull();
      expect(getFromCache('dashboard:org1:tasks')).toBeNull();
      expect(getFromCache('user:u1')).toBe(300);
    });
  });

  describe('clearCache', () => {
    it('removes all entries', () => {
      setCache('a', 1);
      setCache('b', 2);
      clearCache();
      expect(getFromCache('a')).toBeNull();
      expect(getFromCache('b')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('returns size and keys', () => {
      setCache('x', 1);
      setCache('y', 2);
      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('x');
      expect(stats.keys).toContain('y');
    });

    it('returns stats for all entries', () => {
      setCache('live', 1, 60000);
      setCache('another', 2, 60000);
      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('live');
      expect(stats.keys).toContain('another');
    });
  });

  describe('cacheOrCompute', () => {
    it('computes and caches on miss', async () => {
      let calls = 0;
      const result = await cacheOrCompute('computed', async () => {
        calls++;
        return 42;
      });
      expect(result).toBe(42);
      expect(calls).toBe(1);
      // Second call returns cached
      const result2 = await cacheOrCompute('computed', async () => {
        calls++;
        return 99;
      });
      expect(result2).toBe(42);
      expect(calls).toBe(1);
    });
  });

  describe('createCacheKey', () => {
    it('joins parts with colon', () => {
      expect(createCacheKey('a', 'b', 123)).toBe('a:b:123');
    });
  });

  describe('DASHBOARD_CACHE_KEYS', () => {
    it('generates correct keys', () => {
      expect(DASHBOARD_CACHE_KEYS.complianceSummary('org1')).toBe(
        'dashboard:compliance:org1',
      );
      expect(DASHBOARD_CACHE_KEYS.auditLogs('org2')).toBe(
        'dashboard:audit:org2',
      );
      expect(DASHBOARD_CACHE_KEYS.tasks('org3')).toBe('dashboard:tasks:org3');
      expect(DASHBOARD_CACHE_KEYS.evidence('org4')).toBe(
        'dashboard:evidence:org4',
      );
      expect(DASHBOARD_CACHE_KEYS.stats('org5')).toBe('dashboard:stats:org5');
      expect(DASHBOARD_CACHE_KEYS.membership('u1')).toBe('user:membership:u1');
    });
  });

  describe('ORG_CACHE_KEYS', () => {
    it('generates correct keys', () => {
      expect(ORG_CACHE_KEYS.details('o1')).toBe('org:details:o1');
      expect(ORG_CACHE_KEYS.members('o1')).toBe('org:members:o1');
      expect(ORG_CACHE_KEYS.frameworks('o1')).toBe('org:frameworks:o1');
    });
  });

  describe('cleanupCache', () => {
    // Audit 2026-08-02: the original test inserted two 60s entries and
    // asserted `removed === 0`, so the removal branch never ran — a
    // cleanupCache that deleted nothing at all still passed.
    it('removes expired entries and returns count', () => {
      jest.useFakeTimers();
      try {
        setCache('expired', 1, 1000);
        setCache('also-expired', 2, 1000);
        setCache('live', 3, 60000);

        jest.advanceTimersByTime(2000);

        expect(cleanupCache()).toBe(2);
        expect(getCacheStats().keys).toEqual(['live']);
        expect(getFromCache('live')).toBe(3);
      } finally {
        jest.useRealTimers();
      }
    });

    it('returns 0 and keeps every entry when nothing has expired', () => {
      setCache('live', 1, 60000);
      setCache('also-live', 2, 60000);
      expect(cleanupCache()).toBe(0);
      expect(getCacheStats().size).toBe(2);
    });
  });

  describe('cacheWithFallback', () => {
    it('returns computed value on success', async () => {
      const result = await cacheWithFallback(
        'fb1',
        async () => 'ok',
        'fallback',
      );
      expect(result).toBe('ok');
    });

    it('returns fallback on error without stale data', async () => {
      const result = await cacheWithFallback(
        'fb-fail',
        async () => {
          throw new Error('fail');
        },
        'fallback',
        { staleWhileRevalidate: false },
      );
      expect(result).toBe('fallback');
    });

    it('returns stale data when compute fails and stale exists', async () => {
      // Set stale data with expired TTL
      setCache('fb-stale', 'old-data', 0);
      const result = await cacheWithFallback(
        'fb-stale',
        async () => {
          throw new Error('fail');
        },
        'fallback',
        { staleWhileRevalidate: true },
      );
      // Should return stale since staleWhileRevalidate is true
      expect(result).toBe('old-data');
    });

    it('returns cached value on hit', async () => {
      setCache('fb-cached', 'cached-val', 60000);
      const result = await cacheWithFallback(
        'fb-cached',
        async () => 'new',
        'fb',
      );
      expect(result).toBe('cached-val');
    });
  });

  describe('cacheWithBackgroundRefresh', () => {
    it('computes and caches on miss', async () => {
      const result = await cacheWithBackgroundRefresh(
        'bgr1',
        async () => 'data',
      );
      expect(result).toBe('data');
    });

    it('returns cached value when not near expiry', async () => {
      setCache('bgr2', 'cached', 60000);
      const result = await cacheWithBackgroundRefresh(
        'bgr2',
        async () => 'new',
        {
          ttlMs: 60000,
          refreshThresholdMs: 1000,
        },
      );
      expect(result).toBe('cached');
    });

    it('returns null on compute failure', async () => {
      const result = await cacheWithBackgroundRefresh('bgr-fail', async () => {
        throw new Error('fail');
      });
      expect(result).toBeNull();
    });
  });
});
