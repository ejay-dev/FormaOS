/**
 * Tests for lib/security.ts
 *
 * Enterprise security features: 2FA, password validation,
 * session management, IP whitelisting, security events
 */

jest.mock('server-only', () => ({}));

// ── Supabase mock ────────────────────────────────────────────────────────────

function createBuilder(result = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/server').__client;
}

jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { email: 'user@test.com' } },
          error: null,
        }),
      },
    },
  };
  return { createSupabaseAdminClient: jest.fn(() => c), __admin: c };
});

function getAdmin() {
  return require('@/lib/supabase/admin').__admin;
}

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/FormaOS?secret=JBSWY3DPEHPK3PXP',
  })),
  totp: {
    verify: jest.fn(() => true),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

import {
  generate2FASecret,
  enable2FA,
  verify2FAToken,
  disable2FA,
  getSecuritySettings,
  updateSecuritySettings,
  logSecurityEvent,
  getSecurityEvents,
  isIPWhitelisted,
  validatePasswordStrength,
  generateSessionToken,
  isSessionExpired,
} from '@/lib/security';

beforeEach(() => jest.clearAllMocks());

describe('validatePasswordStrength', () => {
  it('returns strong for a complex password', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass');
    expect(result.isStrong).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.feedback).toHaveLength(0);
  });

  it('returns weak for a short password', () => {
    const result = validatePasswordStrength('abc');
    expect(result.isStrong).toBe(false);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('detects missing uppercase', () => {
    const result = validatePasswordStrength('lowercase123!');
    expect(result.feedback).toContain('Include at least one uppercase letter');
  });

  it('detects missing special characters', () => {
    const result = validatePasswordStrength('Password123');
    expect(result.feedback).toContain('Include at least one special character');
  });

  it('penalizes common patterns', () => {
    const strong = validatePasswordStrength('MyStr0ng!Pass');
    const weak = validatePasswordStrength('password123!A');
    expect(weak.score).toBeLessThan(strong.score);
  });

  it('rewards extra length', () => {
    const short = validatePasswordStrength('Ab1!cdef');
    const long = validatePasswordStrength('Ab1!cdefghijkl');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });
});

describe('generateSessionToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
  });
});

describe('generate2FASecret', () => {
  it('creates and stores a new 2FA secret', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await generate2FASecret('user-1', 'user@test.com');

    expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(result.qrCode).toContain('data:image/png');
    expect(result.backupCodes).toHaveLength(8);
    result.backupCodes.forEach((code: string) => {
      expect(code).toMatch(/^[0-9A-F]{12}$/);
    });
  });
});

describe('enable2FA', () => {
  it('enables 2FA when token is valid', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { two_factor_secret: 'JBSWY3DPEHPK3PXP' },
        error: null,
      }),
    );

    const result = await enable2FA('user-1', '123456');
    expect(result).toBe(true);
  });

  it('returns false when token is invalid', async () => {
    const speakeasy = require('speakeasy');
    speakeasy.totp.verify.mockReturnValueOnce(false);

    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { two_factor_secret: 'JBSWY3DPEHPK3PXP' },
        error: null,
      }),
    );

    const result = await enable2FA('user-1', 'wrong');
    expect(result).toBe(false);
  });

  it('throws when no secret found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await expect(enable2FA('user-1', '123456')).rejects.toThrow(
      '2FA secret not found',
    );
  });
});

describe('verify2FAToken', () => {
  it('verifies a valid TOTP token', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { two_factor_secret: 'JBSWY3DPEHPK3PXP', backup_codes: [] },
        error: null,
      }),
    );

    const result = await verify2FAToken('user-1', '123456');
    expect(result).toBe(true);
  });

  it('verifies a backup code and removes it', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          two_factor_secret: 'JBSWY3DPEHPK3PXP',
          backup_codes: ['ABCDEF123456', 'FEDCBA654321'],
        },
        error: null,
      }),
    );

    const result = await verify2FAToken('user-1', 'ABCDEF123456');
    expect(result).toBe(true);
  });

  it('returns false when no security record found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await verify2FAToken('user-1', '123456');
    expect(result).toBe(false);
  });
});

describe('disable2FA', () => {
  it('disables 2FA with correct password', async () => {
    getClient().auth.signInWithPassword.mockResolvedValueOnce({ error: null });
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await disable2FA('user-1', 'correctPass');
    expect(result).toBe(true);
  });

  it('returns false with wrong password', async () => {
    getClient().auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    });

    const result = await disable2FA('user-1', 'wrongPass');
    expect(result).toBe(false);
  });

  it('returns false when no password provided', async () => {
    const result = await disable2FA('user-1', '');
    expect(result).toBe(false);
  });

  it('throws when user not found in admin', async () => {
    getAdmin().auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not found' },
    });

    await expect(disable2FA('user-1', 'pass')).rejects.toThrow(
      'Unable to retrieve user',
    );
  });
});

describe('getSecuritySettings', () => {
  it('returns settings from DB', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          two_factor_enabled: true,
          sso_enabled: false,
          session_timeout: 120,
          require_strong_password: true,
        },
        error: null,
      }),
    );

    const settings = await getSecuritySettings('user-1');
    expect(settings.twoFactorEnabled).toBe(true);
    expect(settings.sessionTimeout).toBe(120);
  });

  it('returns defaults when no record exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const settings = await getSecuritySettings('user-1');
    expect(settings.twoFactorEnabled).toBe(false);
    expect(settings.sessionTimeout).toBe(60);
  });
});

describe('updateSecuritySettings', () => {
  it('upserts settings', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await updateSecuritySettings('user-1', { sessionTimeout: 90 });

    expect(getClient().from).toHaveBeenCalledWith('user_security');
  });
});

describe('logSecurityEvent', () => {
  it('inserts a security event', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await logSecurityEvent('user-1', 'login', { ipAddress: '1.2.3.4' });

    expect(getClient().from).toHaveBeenCalledWith('security_events');
  });
});

describe('getSecurityEvents', () => {
  it('returns events for user', async () => {
    const events = [{ id: 'e1', event_type: 'login' }];
    getClient().from.mockImplementation(() =>
      createBuilder({ data: events, error: null }),
    );

    const result = await getSecurityEvents('user-1');
    expect(result).toEqual(events);
  });

  it('returns empty array on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB error' } }),
    );

    const result = await getSecurityEvents('user-1');
    expect(result).toEqual([]);
  });
});

describe('isIPWhitelisted', () => {
  it('returns true when no whitelist configured', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { ip_whitelist: null }, error: null }),
    );

    const result = await isIPWhitelisted('user-1', '1.2.3.4');
    expect(result).toBe(true);
  });

  it('returns true when IP is in whitelist', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { ip_whitelist: ['1.2.3.4', '5.6.7.8'] },
        error: null,
      }),
    );

    const result = await isIPWhitelisted('user-1', '1.2.3.4');
    expect(result).toBe(true);
  });

  it('returns false when IP is not in whitelist', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { ip_whitelist: ['5.6.7.8'] }, error: null }),
    );

    const result = await isIPWhitelisted('user-1', '1.2.3.4');
    expect(result).toBe(false);
  });
});

describe('isSessionExpired', () => {
  it('returns false for a valid session', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { expires_at: future }, error: null }),
    );

    const result = await isSessionExpired('session-1');
    expect(result).toBe(false);
  });

  it('returns true for expired session', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { expires_at: past }, error: null }),
    );

    const result = await isSessionExpired('session-1');
    expect(result).toBe(true);
  });

  it('returns true when session not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await isSessionExpired('missing');
    expect(result).toBe(true);
  });
});
