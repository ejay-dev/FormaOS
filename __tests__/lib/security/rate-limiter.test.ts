/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));

// Mock Redis as null (forces in-memory fallback)
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
}));

// Mock next/headers
const mockHeadersMap = new Map<string, string>();
jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (key: string) => mockHeadersMap.get(key) ?? null,
  })),
}));

// Mock rate-limit-log and session-security
jest.mock('@/lib/security/rate-limit-log', () => ({
  logRateLimitEvent: jest.fn(),
  logRateLimitFailOpenWarning: jest.fn(),
}));
jest.mock('@/lib/security/session-security', () => ({
  extractClientIP: jest.fn(() => '1.2.3.4'),
}));

import {
  RATE_LIMITS,
  checkRateLimit,
  getRateLimitStatus,
  createRateLimitHeaders,
  createRateLimitedResponse,
  getClientIdentifier,
  getUserIdentifier,
  rateLimitAuth,
  rateLimitSignup,
  rateLimitApi,
} from '@/lib/security/rate-limiter';

describe('security/rate-limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeadersMap.clear();
  });

  // ── Constants ──
  describe('RATE_LIMITS', () => {
    it('has AUTH config with failClosed', () => {
      expect(RATE_LIMITS.AUTH.keyPrefix).toBe('rl:auth');
      expect(RATE_LIMITS.AUTH.failClosed).toBe(true);
    });

    it('has SIGNUP config', () => {
      expect(RATE_LIMITS.SIGNUP.maxRequests).toBe(10);
    });

    it('has API config', () => {
      expect(RATE_LIMITS.API.maxRequests).toBe(100);
    });

    it('has GENERAL, UPLOAD, EXPORT, HEARTBEAT, ACTIVITY configs', () => {
      expect(RATE_LIMITS.GENERAL.keyPrefix).toBe('rl:gen');
      expect(RATE_LIMITS.UPLOAD.keyPrefix).toBe('rl:upload');
      expect(RATE_LIMITS.EXPORT.keyPrefix).toBe('rl:export');
      expect(RATE_LIMITS.HEARTBEAT.keyPrefix).toBe('rl:heartbeat');
      expect(RATE_LIMITS.ACTIVITY.keyPrefix).toBe('rl:activity');
    });
  });

  // ── createRateLimitHeaders ──
  describe('createRateLimitHeaders', () => {
    it('returns standard rate limit headers', () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 50,
        resetAt: 1700000000000,
      };
      const headers = createRateLimitHeaders(result);
      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('50');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('includes Retry-After when provided', () => {
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfter: 60,
      };
      const headers = createRateLimitHeaders(result);
      expect(headers['Retry-After']).toBe('60');
    });
  });

  // ── createRateLimitedResponse ──
  describe('createRateLimitedResponse', () => {
    it('returns 429 response by default', () => {
      const response = createRateLimitedResponse('Too many requests');
      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('supports custom status code', () => {
      const response = createRateLimitedResponse('Slow down', 503);
      expect(response.status).toBe(503);
    });
  });

  // ── getClientIdentifier ──
  describe('getClientIdentifier', () => {
    it('returns x-forwarded-for first IP', async () => {
      mockHeadersMap.set('x-forwarded-for', '10.0.0.1, 10.0.0.2');
      const id = await getClientIdentifier();
      expect(id).toBe('10.0.0.1');
    });

    it('returns x-real-ip when no forwarded-for', async () => {
      mockHeadersMap.set('x-real-ip', '10.0.0.5');
      const id = await getClientIdentifier();
      expect(id).toBe('10.0.0.5');
    });

    it('returns cf-connecting-ip when others absent', async () => {
      mockHeadersMap.set('cf-connecting-ip', '10.0.0.9');
      const id = await getClientIdentifier();
      expect(id).toBe('10.0.0.9');
    });

    it('returns unknown when no headers', async () => {
      const id = await getClientIdentifier();
      expect(id).toBe('unknown');
    });
  });

  // ── getUserIdentifier ──
  describe('getUserIdentifier', () => {
    it('returns x-user-id when present', async () => {
      mockHeadersMap.set('x-user-id', 'user-123');
      const id = await getUserIdentifier();
      expect(id).toBe('user-123');
    });

    it('returns null when absent', async () => {
      const id = await getUserIdentifier();
      expect(id).toBeNull();
    });
  });

  // ── checkRateLimit (in-memory mode since Redis is null) ──
  describe('checkRateLimit', () => {
    it('allows requests under limit', async () => {
      const result = await checkRateLimit(RATE_LIMITS.API, '10.0.0.1');
      expect(result.success).toBe(true);
      expect(result.remaining).toBeLessThan(RATE_LIMITS.API.maxRequests);
    });

    it('uses userId key when provided', async () => {
      const result = await checkRateLimit(
        RATE_LIMITS.API,
        '10.0.0.1',
        'user-1',
      );
      expect(result.success).toBe(true);
    });
  });

  // ── getRateLimitStatus ──
  describe('getRateLimitStatus', () => {
    it('returns status without incrementing', async () => {
      const result = await getRateLimitStatus(RATE_LIMITS.GENERAL, 'fresh-ip');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.GENERAL.maxRequests);
    });
  });

  // ── rateLimitAuth ──
  describe('rateLimitAuth', () => {
    it('allows normal request', async () => {
      mockHeadersMap.set('x-forwarded-for', '99.0.0.1');
      const request = new Request('http://localhost/api/auth/signin');
      const result = await rateLimitAuth(request);
      expect(result.allowed).toBe(true);
      expect(result.headers).toBeDefined();
    });

    it('bypasses in non-production with e2e header', async () => {
      const request = new Request('http://localhost/api/auth/signin', {
        headers: { 'x-formaos-e2e': '1' },
      });
      const result = await rateLimitAuth(request);
      expect(result.allowed).toBe(true);
    });
  });

  // ── rateLimitSignup ──
  describe('rateLimitSignup', () => {
    it('allows normal signup request', async () => {
      mockHeadersMap.set('x-forwarded-for', '88.0.0.1');
      const request = new Request('http://localhost/api/auth/signup');
      const result = await rateLimitSignup(request);
      expect(result.allowed).toBe(true);
    });

    it('bypasses in non-production with e2e header', async () => {
      const request = new Request('http://localhost/api/auth/signup', {
        headers: { 'x-formaos-e2e': '1' },
      });
      const result = await rateLimitSignup(request);
      expect(result.allowed).toBe(true);
    });
  });

  // ── rateLimitApi ──
  describe('rateLimitApi', () => {
    it('allows normal API request', async () => {
      mockHeadersMap.set('x-forwarded-for', '77.0.0.1');
      const request = new Request('http://localhost/api/v1/controls');
      const result = await rateLimitApi(request);
      expect(result.success).toBe(true);
    });

    it('accepts userId', async () => {
      mockHeadersMap.set('x-forwarded-for', '66.0.0.1');
      const request = new Request('http://localhost/api/v1/tasks');
      const result = await rateLimitApi(request, 'u-1');
      expect(result.success).toBe(true);
    });

    it('bypasses in non-production with e2e header', async () => {
      const request = new Request('http://localhost/api/v1/anything', {
        headers: { 'x-formaos-e2e': '1' },
      });
      const result = await rateLimitApi(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.API.maxRequests);
    });
  });
});
