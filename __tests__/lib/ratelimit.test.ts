/** @jest-environment node */

/**
 * Unit tests for lib/ratelimit.ts (pure functions only)
 *
 * Tests header helpers and fail-closed behavior without requiring Redis.
 */

const mockGetRedisClient = jest.fn();
const mockGetRedisConfig = jest.fn(() => ({ restUrl: null, token: null }));

jest.mock('@/lib/redis/client', () => ({
  getRedisClient: (...args: unknown[]) => mockGetRedisClient(...args),
  getRedisConfig: (...args: unknown[]) => mockGetRedisConfig(...args),
}));

import {
  addRateLimitHeaders,
  checkApiRateLimit,
  checkAuthRateLimit,
  checkFormRateLimit,
  getClientIp,
} from '@/lib/ratelimit';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  mockGetRedisClient.mockReset();
  mockGetRedisConfig.mockReset();
  mockGetRedisConfig.mockReturnValue({ restUrl: null, token: null });
  consoleWarnSpy.mockClear();
});

afterAll(() => {
  consoleWarnSpy.mockRestore();
});

// -------------------------------------------------------------------------
// getClientIp
// -------------------------------------------------------------------------

describe('getClientIp', () => {
  function createRequest(headers: Record<string, string>): Request {
    return new Request('http://localhost', {
      headers: new Headers(headers),
    });
  }

  it('extracts IP from x-forwarded-for header', () => {
    const req = createRequest({
      'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
    });
    expect(getClientIp(req)).toBe('192.168.1.100');
  });

  it('extracts single IP from x-forwarded-for', () => {
    const req = createRequest({ 'x-forwarded-for': '203.0.113.50' });
    expect(getClientIp(req)).toBe('203.0.113.50');
  });

  it('extracts IP from cf-connecting-ip header', () => {
    const req = createRequest({ 'cf-connecting-ip': '198.51.100.42' });
    expect(getClientIp(req)).toBe('198.51.100.42');
  });

  it('extracts IP from x-real-ip header', () => {
    const req = createRequest({ 'x-real-ip': '192.0.2.1' });
    expect(getClientIp(req)).toBe('192.0.2.1');
  });

  it('prefers x-forwarded-for over cf-connecting-ip', () => {
    const req = createRequest({
      'x-forwarded-for': '1.2.3.4',
      'cf-connecting-ip': '5.6.7.8',
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('prefers cf-connecting-ip over x-real-ip', () => {
    const req = createRequest({
      'cf-connecting-ip': '5.6.7.8',
      'x-real-ip': '9.10.11.12',
    });
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('returns "unknown" when no IP headers present', () => {
    const req = createRequest({});
    expect(getClientIp(req)).toBe('unknown');
  });

  it('trims whitespace from forwarded IP', () => {
    const req = createRequest({ 'x-forwarded-for': '  10.0.0.1  , 10.0.0.2' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });
});

// -------------------------------------------------------------------------
// addRateLimitHeaders
// -------------------------------------------------------------------------

describe('addRateLimitHeaders', () => {
  it('sets rate limit headers on response', () => {
    const response = new Response('OK');
    const result = addRateLimitHeaders(response, {
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1700000000000,
    });

    expect(result.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(result.headers.get('X-RateLimit-Remaining')).toBe('59');
    expect(result.headers.get('X-RateLimit-Reset')).toBe('1700000000000');
  });

  it('returns the same response object', () => {
    const response = new Response('OK');
    const result = addRateLimitHeaders(response, {
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1700000000000,
    });

    expect(result).toBe(response);
  });
});

describe('rate-limit fail-closed behavior', () => {
  it('fails closed for auth rate limits in production when Redis is unavailable', async () => {
    process.env.NODE_ENV = 'production';
    mockGetRedisConfig.mockReturnValue({ restUrl: null, token: null });

    const result = await checkAuthRateLimit('203.0.113.10');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fails closed for API rate limits in production when Redis is unavailable', async () => {
    process.env.NODE_ENV = 'production';
    mockGetRedisConfig.mockReturnValue({ restUrl: null, token: null });

    const result = await checkApiRateLimit('api-key-123');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('still fails open for form rate limits when Redis is unavailable', async () => {
    process.env.NODE_ENV = 'production';
    mockGetRedisConfig.mockReturnValue({ restUrl: null, token: null });

    const result = await checkFormRateLimit('198.51.100.20');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(result.limit);
  });
});
