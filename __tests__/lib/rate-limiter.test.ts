/** @jest-environment node */

/**
 * Unit tests for lib/security/rate-limiter.ts
 *
 * Tests the public rate limiting API: checkRateLimit, createRateLimitHeaders,
 * getRateLimitStatus, and RATE_LIMITS config. When Redis is unavailable
 * (getRedisClient returns null), the module falls back to in-memory storage.
 */

// Mock Redis client before importing the module under test
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null), // default: Redis unavailable
}));

// Mock next/headers (used by getClientIdentifier/getUserIdentifier)
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve(new Map([['x-forwarded-for', '127.0.0.1']])),
  ),
}));

// Mock rate-limit-log to avoid Supabase calls
jest.mock('@/lib/security/rate-limit-log', () => ({
  logRateLimitEvent: jest.fn(),
}));

// Mock session-security
jest.mock('@/lib/security/session-security', () => ({
  extractClientIP: jest.fn(() => '127.0.0.1'),
  logSecurityEvent: jest.fn(),
  SecurityEventTypes: {},
}));

import {
  checkRateLimit,
  createRateLimitHeaders,
  getRateLimitStatus,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import type { RateLimitConfig } from '@/lib/security/rate-limiter';
import { getRedisClient } from '@/lib/redis/client';

const mockedGetRedis = getRedisClient as jest.Mock;

describe('rate-limiter', () => {
  // Use a short-window config for fast in-memory tests
  const testConfig: RateLimitConfig = {
    windowMs: 2_000, // 2 seconds
    maxRequests: 3,
    keyPrefix: 'rl:test',
  };

  beforeEach(() => {
    // Default: no Redis available (forces in-memory fallback)
    mockedGetRedis.mockReturnValue(null);
  });

  // -----------------------------------------------------------------------
  // RATE_LIMITS config exports
  // -----------------------------------------------------------------------

  describe('RATE_LIMITS constants', () => {
    it('exports AUTH rate limit config with expected fields', () => {
      expect(RATE_LIMITS.AUTH).toEqual(
        expect.objectContaining({
          windowMs: expect.any(Number),
          maxRequests: expect.any(Number),
          keyPrefix: 'rl:auth',
        }),
      );
    });

    it('exports API rate limit config', () => {
      expect(RATE_LIMITS.API.keyPrefix).toBe('rl:api');
      expect(RATE_LIMITS.API.maxRequests).toBeGreaterThan(0);
    });

    it('exports GENERAL and UPLOAD rate limit configs', () => {
      expect(RATE_LIMITS.GENERAL.keyPrefix).toBe('rl:gen');
      expect(RATE_LIMITS.UPLOAD.keyPrefix).toBe('rl:upload');
    });
  });

  // -----------------------------------------------------------------------
  // In-memory fallback (Redis unavailable)
  // -----------------------------------------------------------------------

  describe('in-memory fallback (no Redis)', () => {
    it('allows requests under the limit', async () => {
      const result = await checkRateLimit(testConfig, '10.0.0.1');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(testConfig.maxRequests - 1);
      expect(result.limit).toBe(testConfig.maxRequests);
    });

    it('blocks after exceeding maxRequests', async () => {
      // Use a unique IP to avoid interference from other tests
      const ip = 'block-test-ip';
      for (let i = 0; i < testConfig.maxRequests; i++) {
        await checkRateLimit(testConfig, ip);
      }
      const blocked = await checkRateLimit(testConfig, ip);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it('resets after the time window expires', async () => {
      // Use a very short window
      const shortConfig: RateLimitConfig = {
        windowMs: 50, // 50ms
        maxRequests: 1,
        keyPrefix: 'rl:short',
      };
      const ip = 'reset-test-ip';

      const first = await checkRateLimit(shortConfig, ip);
      expect(first.success).toBe(true);

      const blocked = await checkRateLimit(shortConfig, ip);
      expect(blocked.success).toBe(false);

      // Wait for the window to expire
      await new Promise((resolve) => setTimeout(resolve, 80));

      const afterReset = await checkRateLimit(shortConfig, ip);
      expect(afterReset.success).toBe(true);
    });

    it('separates limits by userId when provided', async () => {
      const ip = 'shared-ip';
      const result1 = await checkRateLimit(testConfig, ip, 'user-a');
      const result2 = await checkRateLimit(testConfig, ip, 'user-b');

      // Both should succeed because they have different keys
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Redis-backed rate limiting
  // -----------------------------------------------------------------------

  describe('Redis-backed rate limiting', () => {
    let mockRedis: Record<string, jest.Mock>;

    beforeEach(() => {
      mockRedis = {
        incr: jest.fn(() => Promise.resolve(1)),
        expire: jest.fn(() => Promise.resolve(true)),
        ttl: jest.fn(() => Promise.resolve(60)),
        get: jest.fn(() => Promise.resolve(null)),
        pipeline: jest.fn(() => ({
          incr: jest.fn(),
          expire: jest.fn(),
          get: jest.fn(),
          ttl: jest.fn(),
          zcard: jest.fn(),
          exec: jest.fn(() => Promise.resolve([])),
        })),
      };
      mockedGetRedis.mockReturnValue(mockRedis);
    });

    it('uses Redis when available and returns success', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await checkRateLimit(testConfig, '10.0.0.2');
      expect(result.success).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('blocks via Redis when count exceeds maxRequests', async () => {
      mockRedis.incr.mockResolvedValue(testConfig.maxRequests + 1);
      mockRedis.ttl.mockResolvedValue(30);

      const result = await checkRateLimit(testConfig, '10.0.0.3');
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('falls back to in-memory when Redis throws', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const result = await checkRateLimit(testConfig, 'fallback-ip');
      // Should still succeed via in-memory fallback
      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // createRateLimitHeaders
  // -----------------------------------------------------------------------

  describe('createRateLimitHeaders', () => {
    it('returns proper rate limit headers', () => {
      const headers = createRateLimitHeaders({
        success: true,
        limit: 100,
        remaining: 95,
        resetAt: 1700000000000,
      });

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('includes Retry-After when retryAfter is provided', () => {
      const headers = createRateLimitHeaders({
        success: false,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 30000,
        retryAfter: 30,
      });

      expect(headers['Retry-After']).toBe('30');
    });

    it('omits Retry-After when not provided', () => {
      const headers = createRateLimitHeaders({
        success: true,
        limit: 10,
        remaining: 5,
        resetAt: Date.now(),
      });

      expect(headers['Retry-After']).toBeUndefined();
    });
  });
});
