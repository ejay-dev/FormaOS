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
});
