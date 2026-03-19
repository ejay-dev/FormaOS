/** @jest-environment node */

/**
 * Unit tests for lib/security/password-security.ts
 * — password strength validation and HIBP breach checking
 */

// Mock global fetch for HIBP API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  validatePasswordStrength,
  checkPasswordBreached,
  validatePassword,
} from '@/lib/security/password-security';

// ---------------------------------------------------------------------------
// validatePasswordStrength (pure function)
// ---------------------------------------------------------------------------

describe('validatePasswordStrength', () => {
  it('accepts a strong password meeting all criteria', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass1234');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('rejects a password shorter than 12 characters', () => {
    const result = validatePasswordStrength('Sh0rt!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters');
  });

  it('rejects a password missing uppercase letters', () => {
    const result = validatePasswordStrength('alllowercase1!xx');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Password must contain at least one uppercase letter',
    );
  });

  it('rejects a password missing lowercase letters', () => {
    const result = validatePasswordStrength('ALLUPPERCASE1!XX');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Password must contain at least one lowercase letter',
    );
  });

  it('rejects a password missing numbers', () => {
    const result = validatePasswordStrength('NoNumbersHere!!x');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Password must contain at least one number',
    );
  });

  it('rejects a password missing special characters', () => {
    const result = validatePasswordStrength('NoSpecialChars1x');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Password must contain at least one special character',
    );
  });

  it('penalizes common password patterns', () => {
    const result = validatePasswordStrength('password1234!A');
    expect(result.errors).toContain('Password contains a common pattern');
  });

  it('penalizes qwerty pattern', () => {
    const result = validatePasswordStrength('qwertyTest12!x');
    expect(result.errors).toContain('Password contains a common pattern');
  });

  it('penalizes repeated characters', () => {
    const result = validatePasswordStrength('Aaa1!bbbcccdddd');
    expect(result.errors).toContain(
      'Password should not contain repeated characters',
    );
  });

  it('gives a higher score for longer passwords (>= 16 chars)', () => {
    const short = validatePasswordStrength('MyStr0ng!Pas');
    const long = validatePasswordStrength('MyStr0ng!Pass1234');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });

  it('caps score at 4', () => {
    const result = validatePasswordStrength(
      'VeryL0ng&$tr0ng!P@ssW0rd#2024ExtendedPhrase',
    );
    expect(result.score).toBeLessThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// checkPasswordBreached (HIBP API)
// ---------------------------------------------------------------------------

describe('checkPasswordBreached', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns breached=true when the suffix matches an API response', async () => {
    // SHA1 of "password" = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    // prefix = 5BAA6, suffix = 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\nABCDEF1234567890ABCDEF1234567890ABC:5',
    });

    const result = await checkPasswordBreached('password');
    expect(result.breached).toBe(true);
    expect(result.count).toBe(3861493);
  });

  it('returns breached=false when no suffix matches', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'ABCDEF1234567890ABCDEF1234567890ABC:5\nFEDCBA987654:2',
    });

    const result = await checkPasswordBreached('unique-secret-2024!@#XYZ');
    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
  });

  it('fails-open (returns breached=false) when API returns non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const result = await checkPasswordBreached('anything');
    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
  });

  it('fails-open when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await checkPasswordBreached('anything');
    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
  });

  it('only sends the first 5 characters of the SHA1 hash (k-anonymity)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    await checkPasswordBreached('test-password');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    // The prefix should be exactly 5 hex characters
    const prefix = url.split('/').pop()!;
    expect(prefix).toMatch(/^[A-F0-9]{5}$/);
  });
});

// ---------------------------------------------------------------------------
// validatePassword (integration of strength + breach check)
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns valid=true for a strong, non-breached password', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'AAAA:1\nBBBB:2',
    });

    const result = await validatePassword('MyStr0ng!Pass1234');
    expect(result.valid).toBe(true);
    expect(result.breached).toBe(false);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid=false when password is breached even if otherwise strong', async () => {
    // Force a breach match by using "password" whose SHA1 is well-known
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '1E4C9B93F3F0682250B6CF8331B7EE68FD8:100\n',
    });

    const result = await validatePassword('password');
    expect(result.valid).toBe(false);
    expect(result.breached).toBe(true);
    expect(result.breachCount).toBe(100);
  });

  it('aggregates both strength and breach errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '1E4C9B93F3F0682250B6CF8331B7EE68FD8:50\n',
    });

    // "password" is short (<12), missing special char variety, common pattern, AND breached
    const result = await validatePassword('password');
    expect(result.valid).toBe(false);
    // Should have strength errors AND breach error
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors.some((e) => e.includes('data breaches'))).toBe(true);
  });
});
