/**
 * Tests for lib/auth/hosted-auth-link.ts
 * Covers: normalizeAppBase, coerceEmailOtpType, parseSupabaseActionLink, buildHostedAuthConfirmLink.
 */

import {
  normalizeAppBase,
  coerceEmailOtpType,
  parseSupabaseActionLink,
  buildHostedAuthConfirmLink,
} from '@/lib/auth/hosted-auth-link';

describe('normalizeAppBase', () => {
  it('returns default for null', () => {
    expect(normalizeAppBase(null)).toBe('https://app.formaos.com.au');
  });

  it('returns default for undefined', () => {
    expect(normalizeAppBase(undefined)).toBe('https://app.formaos.com.au');
  });

  it('strips trailing slash from base', () => {
    expect(normalizeAppBase('https://example.com/')).toBe(
      'https://example.com',
    );
  });

  it('returns origin only (strips path)', () => {
    expect(normalizeAppBase('https://example.com/some/path')).toBe(
      'https://example.com',
    );
  });

  it('falls back to default for invalid URL', () => {
    expect(normalizeAppBase('not a url')).toBe('https://app.formaos.com.au');
  });
});

describe('coerceEmailOtpType', () => {
  it('returns null for null input', () => {
    expect(coerceEmailOtpType(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(coerceEmailOtpType('')).toBeNull();
  });

  it('coerces valid type', () => {
    expect(coerceEmailOtpType('signup')).toBe('signup');
    expect(coerceEmailOtpType('recovery')).toBe('recovery');
    expect(coerceEmailOtpType('invite')).toBe('invite');
  });

  it('is case-insensitive', () => {
    expect(coerceEmailOtpType('SIGNUP')).toBe('signup');
  });

  it('returns null for invalid type', () => {
    expect(coerceEmailOtpType('banana')).toBeNull();
  });
});

describe('parseSupabaseActionLink', () => {
  it('returns null for null input', () => {
    expect(parseSupabaseActionLink(null)).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseSupabaseActionLink('not a url')).toBeNull();
  });

  it('parses token_hash and type', () => {
    const link =
      'https://auth.example.com/verify?token_hash=abc123&type=signup&redirect_to=/dashboard';
    const result = parseSupabaseActionLink(link);
    expect(result).toEqual({
      tokenHash: 'abc123',
      type: 'signup',
      redirectTo: '/dashboard',
    });
  });

  it('parses token param as fallback', () => {
    const link = 'https://auth.example.com/verify?token=xyz789&type=recovery';
    const result = parseSupabaseActionLink(link);
    expect(result?.tokenHash).toBe('xyz789');
    expect(result?.type).toBe('recovery');
  });

  it('returns null fields for missing params', () => {
    const link = 'https://auth.example.com/verify';
    const result = parseSupabaseActionLink(link);
    expect(result?.tokenHash).toBeNull();
    expect(result?.type).toBeNull();
    expect(result?.redirectTo).toBeNull();
  });
});

describe('buildHostedAuthConfirmLink', () => {
  it('returns null when no token and no action link', () => {
    expect(buildHostedAuthConfirmLink({})).toBeNull();
  });

  it('builds link from hashed_token and verification_type', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'tok123',
        verification_type: 'signup',
      },
    });
    expect(link).toContain('/auth/confirm');
    expect(link).toContain('token_hash=tok123');
    expect(link).toContain('type=signup');
  });

  it('includes redirect_to when provided', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'tok123',
        verification_type: 'signup',
        redirect_to: '/onboarding',
      },
    });
    expect(link).toContain('redirect_to=%2Fonboarding');
  });

  it('falls back to action_link when no token', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        action_link:
          'https://auth.example.com/verify?token_hash=abc&type=invite',
      },
    });
    expect(link).toContain('/auth/confirm');
    expect(link).toContain('token_hash=abc');
    expect(link).toContain('type=invite');
  });

  it('uses custom appBase', () => {
    const link = buildHostedAuthConfirmLink({
      appBase: 'https://custom.example.com',
      properties: {
        hashed_token: 'tok',
        verification_type: 'recovery',
      },
    });
    expect(link).toContain('https://custom.example.com/auth/confirm');
  });

  it('uses fallbackType when action_link has no parseable token', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        action_link: 'https://auth.example.com/verify',
      },
      fallbackType: 'magiclink',
    });
    expect(link).toContain('type=magiclink');
  });
});
