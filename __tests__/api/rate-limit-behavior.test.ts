/** @jest-environment node */

const mockRateLimitAuth = jest.fn();
const mockRateLimitApi = jest.fn();
const mockCreateSupabaseServerClient = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitAuth: (...args: unknown[]) => mockRateLimitAuth(...args),
  rateLimitApi: (...args: unknown[]) => mockRateLimitApi(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: (...args: unknown[]) =>
    mockCreateSupabaseServerClient(...args),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('@/lib/provisioning/workspace-recovery', () => ({
  recoverUserWorkspace: jest.fn(),
}));

jest.mock('@/lib/security/session-security', () => ({
  createTrackedSession: jest.fn(),
  generateDeviceFingerprint: jest.fn(),
  generateSessionToken: jest.fn(() => 'tracked-session-token'),
  extractClientIP: jest.fn(() => '127.0.0.1'),
  logSecurityEvent: jest.fn(),
  SecurityEventTypes: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  },
}));

jest.mock('@/lib/onboarding/checklist-data', () => ({
  getChecklistCountsForOrg: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { POST as bootstrapPost } from '@/app/api/auth/bootstrap/route';
import { GET as onboardingChecklistGet } from '@/app/api/onboarding/checklist/route';

describe('API rate limit behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('auth bootstrap returns 429 with limiter headers when API limiter blocks', async () => {
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
    });
    mockRateLimitApi.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      resetAt: new Date('2026-03-21T12:00:00Z').getTime(),
      retryAfter: 60,
    });

    const response = await bootstrapPost(
      new Request('http://localhost/api/auth/bootstrap', { method: 'POST' }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'too_many_requests',
    });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1774094400');
    expect(mockRateLimitApi).toHaveBeenCalledWith(
      expect.any(Request),
      'user-123',
    );
  });

  test('onboarding checklist returns 429 before auth lookup when API limiter blocks', async () => {
    mockRateLimitApi.mockResolvedValue({
      success: false,
      limit: 120,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const response = await onboardingChecklistGet(
      new Request('http://localhost/api/onboarding/checklist'),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: 'too_many_requests',
    });
    expect(mockCreateSupabaseServerClient).not.toHaveBeenCalled();
  });
});
