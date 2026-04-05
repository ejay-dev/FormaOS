/**
 * Tests for lib/security/detection-rules.ts
 * All functions depend on Supabase — use Proxy-based chain mock.
 */

// Proxy-based chain mock for Supabase queries
function chain(data: any = null, extra: Record<string, any> = {}) {
  const result = { data, error: null, count: null, ...extra };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined; // not thenable
      if (prop in result) return (result as any)[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));
jest.mock('@/lib/security/geo-ip', () => ({
  getGeoIpProvider: () => ({
    lookup: jest.fn().mockResolvedValue(null),
  }),
}));

import {
  detectBruteForce,
  detectImpossibleTravel,
  detectNewDevice,
  detectSessionAnomaly,
  detectPrivilegeEscalation,
  detectRateLimitViolation,
  enrichGeoData,
  parseUserAgent,
} from '@/lib/security/detection-rules';

beforeEach(() => {
  mockFrom.mockReset();
});

// ============================================================
// detectBruteForce
// ============================================================
describe('detectBruteForce', () => {
  const ctx = { ip: '1.2.3.4', userAgent: 'Chrome' };

  it('returns triggered=true when count >= threshold (by IP)', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 5 }));
    const result = await detectBruteForce(ctx, { by: 'ip', value: '1.2.3.4' });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('returns triggered=true critical for user-based brute force', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 10 }));
    const result = await detectBruteForce(ctx, { by: 'user', value: 'user-1' });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('critical');
  });

  it('returns triggered=false when below threshold', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 2 }));
    const result = await detectBruteForce(ctx, { by: 'ip', value: '1.2.3.4' });
    expect(result.triggered).toBe(false);
  });

  it('returns triggered=false on DB error', async () => {
    mockFrom.mockReturnValue(
      chain(null, { error: { message: 'fail' }, count: null }),
    );
    const result = await detectBruteForce(ctx, { by: 'ip', value: '1.2.3.4' });
    expect(result.triggered).toBe(false);
  });
});

// ============================================================
// detectImpossibleTravel
// ============================================================
describe('detectImpossibleTravel', () => {
  it('returns triggered=false when userId missing', async () => {
    const result = await detectImpossibleTravel({
      ip: '1.2.3.4',
      userAgent: 'Chrome',
    });
    expect(result.triggered).toBe(false);
  });

  it('returns triggered=false when geoCountry missing', async () => {
    const result = await detectImpossibleTravel({
      ip: '1.2.3.4',
      userAgent: 'Chrome',
      userId: 'u1',
    });
    expect(result.triggered).toBe(false);
  });

  it('triggers when multiple countries in short window', async () => {
    mockFrom.mockReturnValue(
      chain([
        { geo_country: 'AU', created_at: new Date().toISOString() },
        { geo_country: 'US', created_at: new Date().toISOString() },
      ]),
    );
    const result = await detectImpossibleTravel({
      ip: '1.2.3.4',
      userAgent: 'Chrome',
      userId: 'u1',
      geoCountry: 'JP',
    });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('medium');
  });

  it('does not trigger when single country', async () => {
    mockFrom.mockReturnValue(
      chain([{ geo_country: 'AU', created_at: new Date().toISOString() }]),
    );
    const result = await detectImpossibleTravel({
      ip: '1.2.3.4',
      userAgent: 'Chrome',
      userId: 'u1',
      geoCountry: 'AU',
    });
    expect(result.triggered).toBe(false);
  });
});

// ============================================================
// detectNewDevice
// ============================================================
describe('detectNewDevice', () => {
  it('returns triggered=false when no userId', async () => {
    const result = await detectNewDevice({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
    });
    expect(result.triggered).toBe(false);
  });

  it('returns triggered=false when no deviceFingerprint', async () => {
    const result = await detectNewDevice({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      userId: 'u1',
    });
    expect(result.triggered).toBe(false);
  });

  it('triggers when device seen <= 1 time', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 0 }));
    const result = await detectNewDevice({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      userId: 'u1',
      deviceFingerprint: 'fp123',
    });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('low');
  });

  it('does not trigger when device seen > 1 time', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 5 }));
    const result = await detectNewDevice({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      userId: 'u1',
      deviceFingerprint: 'fp123',
    });
    expect(result.triggered).toBe(false);
  });
});

// ============================================================
// detectSessionAnomaly
// ============================================================
describe('detectSessionAnomaly', () => {
  it('returns triggered=false when no deviceFingerprint', async () => {
    const result = await detectSessionAnomaly('sess-1', {
      ip: '1.1.1.1',
      userAgent: 'Chrome',
    });
    expect(result.triggered).toBe(false);
  });

  it('triggers when fingerprint mismatch', async () => {
    mockFrom.mockReturnValue(
      chain({ device_fingerprint: 'old-fp', user_agent: 'Chrome' }),
    );
    const result = await detectSessionAnomaly('sess-1', {
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      deviceFingerprint: 'new-fp',
    });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('medium');
  });

  it('does not trigger when fingerprints match', async () => {
    mockFrom.mockReturnValue(
      chain({ device_fingerprint: 'same-fp', user_agent: 'Chrome' }),
    );
    const result = await detectSessionAnomaly('sess-1', {
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      deviceFingerprint: 'same-fp',
    });
    expect(result.triggered).toBe(false);
  });
});

// ============================================================
// detectPrivilegeEscalation
// ============================================================
describe('detectPrivilegeEscalation', () => {
  it('triggers when non-admin accesses /admin path', async () => {
    const result = await detectPrivilegeEscalation(
      { ip: '1.1.1.1', userAgent: 'Chrome', path: '/admin/settings' },
      'member',
    );
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('does not trigger for admin role on /admin', async () => {
    const result = await detectPrivilegeEscalation(
      { ip: '1.1.1.1', userAgent: 'Chrome', path: '/admin/settings' },
      'admin',
    );
    expect(result.triggered).toBe(false);
  });

  it('does not trigger for founder role on /admin', async () => {
    const result = await detectPrivilegeEscalation(
      { ip: '1.1.1.1', userAgent: 'Chrome', path: '/admin/settings' },
      'founder',
    );
    expect(result.triggered).toBe(false);
  });

  it('triggers when user not in org for API route', async () => {
    mockFrom.mockReturnValue(chain([]));
    const result = await detectPrivilegeEscalation(
      {
        ip: '1.1.1.1',
        userAgent: 'Chrome',
        path: '/api/v1/data',
        orgId: 'org-1',
        userId: 'u-1',
      },
      'member',
    );
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('high');
  });
});

// ============================================================
// detectRateLimitViolation
// ============================================================
describe('detectRateLimitViolation', () => {
  it('returns triggered=false when status != 429', async () => {
    const result = await detectRateLimitViolation({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      statusCode: 200,
    });
    expect(result.triggered).toBe(false);
  });

  it('triggers medium when 5-9 violations', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 7 }));
    const result = await detectRateLimitViolation({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      statusCode: 429,
    });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('medium');
  });

  it('triggers high when >= 10 violations', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 15 }));
    const result = await detectRateLimitViolation({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      statusCode: 429,
    });
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('returns triggered=false when few violations', async () => {
    mockFrom.mockReturnValue(chain(null, { count: 2 }));
    const result = await detectRateLimitViolation({
      ip: '1.1.1.1',
      userAgent: 'Chrome',
      statusCode: 429,
    });
    expect(result.triggered).toBe(false);
  });
});

// ============================================================
// parseUserAgent
// ============================================================
describe('parseUserAgent', () => {
  it('parses Chrome user agent', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    );
    expect(result.browser).toBe('Chrome');
    expect(result.os).toContain('Windows');
  });

  it('parses mobile user agent', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    );
    expect(result.device).toBe('iPhone');
  });

  it('handles empty string', () => {
    const result = parseUserAgent('');
    expect(result.browser).toBeUndefined();
    expect(result.os).toBeUndefined();
    expect(result.device).toBeUndefined();
  });
});

// ============================================================
// enrichGeoData
// ============================================================
describe('enrichGeoData', () => {
  it('returns empty for localhost', async () => {
    const result = await enrichGeoData('127.0.0.1');
    expect(result).toEqual({});
  });

  it('returns empty for 0.0.0.0', async () => {
    const result = await enrichGeoData('0.0.0.0');
    expect(result).toEqual({});
  });
});
