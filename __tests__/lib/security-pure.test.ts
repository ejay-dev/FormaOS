/** @jest-environment node */

/**
 * Unit tests for lib/security.ts (pure functions only)
 *
 * Tests validatePasswordStrength() and generateSessionToken()
 * without requiring Supabase or external service connections.
 */

import { validatePasswordStrength, generateSessionToken } from '@/lib/security';

// -------------------------------------------------------------------------
// validatePasswordStrength
// -------------------------------------------------------------------------

describe('validatePasswordStrength', () => {
  it('accepts a strong password', () => {
    const result = validatePasswordStrength('MyStr0ng!P@ss');
    expect(result.isStrong).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.feedback).toHaveLength(0);
  });

  it('penalizes a short password', () => {
    const result = validatePasswordStrength('Ab1!');
    // Short password still has variety so may pass threshold,
    // but should always flag length issue in feedback
    expect(result.feedback).toContain('Password must be at least 8 characters');
  });

  it('penalizes missing uppercase', () => {
    const result = validatePasswordStrength('alllowercase1!');
    expect(result.feedback).toContain('Include at least one uppercase letter');
  });

  it('penalizes missing lowercase', () => {
    const result = validatePasswordStrength('ALLUPPERCASE1!');
    expect(result.feedback).toContain('Include at least one lowercase letter');
  });

  it('penalizes missing numbers', () => {
    const result = validatePasswordStrength('NoNumbers!Here');
    expect(result.feedback).toContain('Include at least one number');
  });

  it('penalizes missing special characters', () => {
    const result = validatePasswordStrength('NoSpecialChars1');
    expect(result.feedback).toContain('Include at least one special character');
  });

  it('penalizes common patterns', () => {
    const result = validatePasswordStrength('password123!A');
    expect(result.feedback).toContain('Avoid common patterns and words');
  });

  it('penalizes qwerty pattern', () => {
    const result = validatePasswordStrength('qwertyTest1!');
    expect(result.feedback).toContain('Avoid common patterns and words');
  });

  it('gives higher score for longer passwords', () => {
    const short = validatePasswordStrength('Ab1!cdef');
    const long = validatePasswordStrength('Ab1!cdefghijklmn');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });

  it('score is capped at 5', () => {
    const result = validatePasswordStrength(
      'VeryL0ng&Str0ng!P@ssw0rD#2024Extra',
    );
    expect(result.score).toBeLessThanOrEqual(5);
  });

  it('returns score as a number', () => {
    const result = validatePasswordStrength('test');
    expect(typeof result.score).toBe('number');
  });

  it('returns feedback as an array', () => {
    const result = validatePasswordStrength('weak');
    expect(Array.isArray(result.feedback)).toBe(true);
  });
});

// -------------------------------------------------------------------------
// generateSessionToken
// -------------------------------------------------------------------------

describe('generateSessionToken', () => {
  it('returns a non-empty string', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('returns a 64-character hex string (32 bytes)', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSessionToken());
    }
    expect(tokens.size).toBe(100);
  });
});
