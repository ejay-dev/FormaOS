/**
 * @jest-environment node
 *
 * Hard flow integration — /api/trust-packet/vendor is a public procurement
 * endpoint that returns a branded PDF, rate-limited to 5 req / 10 min per IP.
 *
 * Regressions we guard against:
 *   - Rate limiter silently bypassed (spam/abuse vector)
 *   - PDF magic bytes missing (corrupted download)
 *   - Attachment filename injected or missing the .pdf extension
 *   - Uptime fetch failure crashes the route instead of rendering with 0%
 *   - Cache-Control accidentally flipped to private (breaks CDN cache)
 */

const mockCheckRateLimit = jest.fn();
const mockGetClientIdentifier = jest.fn();
const mockFetchPublicUptime = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => {
  const actual = jest.requireActual('@/lib/security/rate-limiter');
  return {
    ...actual,
    checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
    getClientIdentifier: () => mockGetClientIdentifier(),
    createRateLimitHeaders: actual.createRateLimitHeaders,
    RATE_LIMITS: actual.RATE_LIMITS,
  };
});

jest.mock('@/lib/status/public-uptime', () => ({
  fetchPublicUptimeChecks: (...a: unknown[]) => mockFetchPublicUptime(...a),
}));

import { GET } from '@/app/api/trust-packet/vendor/route';

describe('GET /api/trust-packet/vendor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIdentifier.mockResolvedValue('127.0.0.1');
    mockFetchPublicUptime.mockResolvedValue([
      { ok: true },
      { ok: true },
      { ok: false },
    ]);
  });

  it('returns 429 JSON + rate-limit headers when quota is exhausted', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 600,
    });

    const res = await GET();
    expect(res.status).toBe(429);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    // No PDF body on rejection — confirm it's NOT a pdf
    expect(res.headers.get('content-type')).not.toMatch(/pdf/);
    const body = await res.json();
    expect(body.error).toMatch(/rate limit/i);
    // Rate-limit headers should accompany the 429 so clients can back off
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');

    // Must short-circuit: uptime fetch never runs when rate-limited
    expect(mockFetchPublicUptime).not.toHaveBeenCalled();
  });

  it('happy path: returns a valid PDF with correct headers', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 600,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');

    // Attachment filename: FormaOS_Vendor_Trust_Packet_YYYY-MM-DD.pdf
    const disp = res.headers.get('content-disposition');
    expect(disp).toMatch(
      /^attachment; filename="FormaOS_Vendor_Trust_Packet_\d{4}-\d{2}-\d{2}\.pdf"$/,
    );

    // CDN-cacheable: public + max-age 1h
    const cache = res.headers.get('cache-control');
    expect(cache).toContain('public');
    expect(cache).toMatch(/max-age=3600/);

    // Validate PDF magic bytes
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(1000);

    // Content-Length matches actual byte length
    expect(res.headers.get('content-length')).toBe(String(buf.length));

    // Uptime is fetched for both 7d and 30d windows
    expect(mockFetchPublicUptime).toHaveBeenCalledTimes(2);
  });

  it('handles zero uptime checks without dividing by zero', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: true,
      limit: 5,
      remaining: 4,
      reset: 0,
    });
    mockFetchPublicUptime.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    // Rendering must still succeed — should not throw on empty uptime set
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('rate-limit identifier is the client IP (per-IP quota, not global)', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: 0,
    });
    mockGetClientIdentifier.mockResolvedValueOnce('203.0.113.9');
    await GET();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ maxRequests: 5, keyPrefix: 'rl:export' }),
      '203.0.113.9',
    );
  });
});
