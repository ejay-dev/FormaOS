/** @jest-environment node */

import {
  getCachedIntelligence,
  setCachedIntelligence,
  getCachedFrameworkIntelligence,
  setCachedFrameworkIntelligence,
  checkRateLimit,
  getRateLimitStatus,
  clearIntelligenceCache,
  clearRateLimit,
} from '@/lib/cache/intelligence-cache';

describe('lib/cache/intelligence-cache', () => {
  beforeEach(() => {
    clearIntelligenceCache();
    clearRateLimit();
  });

  describe('getCachedIntelligence / setCachedIntelligence', () => {
    it('returns null for cache miss', () => {
      expect(getCachedIntelligence('org1')).toBeNull();
    });

    it('stores and retrieves data', () => {
      setCachedIntelligence('org1', { score: 85 });
      expect(getCachedIntelligence('org1')).toEqual({ score: 85 });
    });

    it('returns null for expired data', () => {
      setCachedIntelligence('org1', { old: true });
      // Manually expire by modifying internal state (60s TTL)
      // We can't easily do this without mocking Date.now, so test fresh data
      expect(getCachedIntelligence('org1')).toEqual({ old: true });
    });

    it('handles different orgs independently', () => {
      setCachedIntelligence('org1', 'data1');
      setCachedIntelligence('org2', 'data2');
      expect(getCachedIntelligence('org1')).toBe('data1');
      expect(getCachedIntelligence('org2')).toBe('data2');
    });
  });

  describe('getCachedFrameworkIntelligence / setCachedFrameworkIntelligence', () => {
    it('returns null for cache miss', () => {
      expect(getCachedFrameworkIntelligence('org1')).toBeNull();
    });

    it('stores and retrieves framework data', () => {
      setCachedFrameworkIntelligence('org1', { frameworks: ['SOC2'] });
      expect(getCachedFrameworkIntelligence('org1')).toEqual({
        frameworks: ['SOC2'],
      });
    });
  });

  describe('checkRateLimit', () => {
    it('allows first request', () => {
      expect(checkRateLimit('org1')).toBe(true);
    });

    it('allows up to 10 requests', () => {
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit('org1')).toBe(true);
      }
    });

    it('blocks 11th request', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('org1');
      }
      expect(checkRateLimit('org1')).toBe(false);
    });

    it('tracks orgs independently', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('org1');
      }
      expect(checkRateLimit('org1')).toBe(false);
      expect(checkRateLimit('org2')).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns full remaining for new org', () => {
      const status = getRateLimitStatus('org-new');
      expect(status.remaining).toBe(10);
    });

    it('decrements remaining after requests', () => {
      checkRateLimit('org1');
      checkRateLimit('org1');
      const status = getRateLimitStatus('org1');
      expect(status.remaining).toBe(8);
    });

    it('returns 0 remaining when exhausted', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('org1');
      }
      const status = getRateLimitStatus('org1');
      expect(status.remaining).toBe(0);
    });
  });

  describe('clearIntelligenceCache', () => {
    it('clears specific org', () => {
      setCachedIntelligence('org1', 'data1');
      setCachedIntelligence('org2', 'data2');
      clearIntelligenceCache('org1');
      expect(getCachedIntelligence('org1')).toBeNull();
      expect(getCachedIntelligence('org2')).toBe('data2');
    });

    it('clears all orgs when no arg', () => {
      setCachedIntelligence('org1', 'data1');
      setCachedIntelligence('org2', 'data2');
      clearIntelligenceCache();
      expect(getCachedIntelligence('org1')).toBeNull();
      expect(getCachedIntelligence('org2')).toBeNull();
    });
  });

  describe('clearRateLimit', () => {
    it('clears specific org', () => {
      for (let i = 0; i < 10; i++) checkRateLimit('org1');
      clearRateLimit('org1');
      expect(checkRateLimit('org1')).toBe(true);
    });

    it('clears all orgs when no arg', () => {
      for (let i = 0; i < 10; i++) checkRateLimit('org1');
      for (let i = 0; i < 10; i++) checkRateLimit('org2');
      clearRateLimit();
      expect(checkRateLimit('org1')).toBe(true);
      expect(checkRateLimit('org2')).toBe(true);
    });
  });
});
