/** @jest-environment node */

const mockRateLimitSignup = jest.fn();
const mockValidatePassword = jest.fn();
const mockGenerateLink = jest.fn();
const mockSendAuthEmail = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitSignup: (...args: unknown[]) => mockRateLimitSignup(...args),
}));

jest.mock('@/lib/security/password-security', () => ({
  validatePassword: (...args: unknown[]) => mockValidatePassword(...args),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        generateLink: (...args: unknown[]) => mockGenerateLink(...args),
      },
    },
  })),
}));

jest.mock('@/lib/email/send-auth-email', () => ({
  sendAuthEmail: (...args: unknown[]) => mockSendAuthEmail(...args),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import { POST as emailSignupPost } from '@/app/api/auth/email-signup/route';

describe('/api/auth/email-signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitSignup.mockResolvedValue({
      allowed: true,
      headers: {},
    });
    mockValidatePassword.mockResolvedValue({
      valid: true,
      errors: [],
      breached: false,
      breachCount: 0,
    });
    mockSendAuthEmail.mockResolvedValue({ success: true });
  });

  test('returns backend_unavailable when Supabase auth reports upstream outage', async () => {
    mockGenerateLink.mockResolvedValue({
      data: null,
      error: {
        message:
          'upstream connect error or disconnect/reset before headers. retried and the latest reset reason: connection timeout',
      },
    });

    const response = await emailSignupPost(
      new Request('http://localhost/api/auth/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'signup@example.com',
          password: 'SmokeTest123!@#',
          plan: 'pro',
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'backend_unavailable',
    });
    expect(mockSendAuthEmail).not.toHaveBeenCalled();
  });
});
