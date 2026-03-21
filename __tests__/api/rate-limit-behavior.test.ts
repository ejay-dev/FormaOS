/** @jest-environment node */

const mockRateLimitAuth = jest.fn();
const mockRateLimitApi = jest.fn();
const mockRateLimitSignup = jest.fn();
const mockCreateSupabaseServerClient = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitAuth: (...args: unknown[]) => mockRateLimitAuth(...args),
  rateLimitApi: (...args: unknown[]) => mockRateLimitApi(...args),
  rateLimitSignup: (...args: unknown[]) => mockRateLimitSignup(...args),
  createRateLimitHeaders: jest.requireActual('@/lib/security/rate-limiter')
    .createRateLimitHeaders,
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
import { POST as emailSignupPost } from '@/app/api/auth/email-signup/route';
import { POST as passwordValidatePost } from '@/app/api/auth/password/validate/route';
import { GET as onboardingChecklistGet } from '@/app/api/onboarding/checklist/route';

describe('API rate limit behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitSignup.mockResolvedValue({
      allowed: true,
      headers: {},
    });
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

  test('password validation uses API limiter and preserves limiter headers', async () => {
    mockRateLimitApi.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      resetAt: new Date('2026-03-21T12:10:00Z').getTime(),
      retryAfter: 45,
    });

    const response = await passwordValidatePost(
      new Request('http://localhost/api/auth/password/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'SmokeTest123!@#' }),
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'too_many_requests',
      errors: ['Too many requests. Please try again later.'],
    });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBe('45');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1774095000');
    expect(mockRateLimitApi).toHaveBeenCalledWith(expect.any(Request));
    expect(mockRateLimitAuth).not.toHaveBeenCalled();
  });

  test('email signup uses signup limiter and returns limiter headers when blocked', async () => {
    mockRateLimitSignup.mockResolvedValue({
      allowed: false,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
      error: 'too_many_requests',
    });

    const response = await emailSignupPost(
      new Request('http://localhost/api/auth/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'smoke@example.com',
          password: 'SmokeTest123!@#',
        }),
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'too_many_requests',
    });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(mockRateLimitSignup).toHaveBeenCalledWith(expect.any(Request));
    expect(mockRateLimitAuth).not.toHaveBeenCalled();
  });
});
