/**
 * Tests for lib/auth/hosted-auth-link.ts — pure functions
 */

import {
  normalizeAppBase,
  coerceEmailOtpType,
  parseSupabaseActionLink,
  buildHostedAuthConfirmLink,
} from '@/lib/auth/hosted-auth-link';

describe('normalizeAppBase', () => {
  it('returns default when null', () => {
    expect(normalizeAppBase(null)).toBe('https://app.formaos.com.au');
  });

  it('returns default when empty string', () => {
    expect(normalizeAppBase('')).toBe('https://app.formaos.com.au');
  });

  it('strips trailing slash and path', () => {
    expect(normalizeAppBase('https://custom.example.com/path')).toBe(
      'https://custom.example.com',
    );
  });

  it('returns origin for valid URL', () => {
    expect(normalizeAppBase('https://app.example.com')).toBe(
      'https://app.example.com',
    );
  });

  it('returns default for invalid URL', () => {
    expect(normalizeAppBase('not-a-url')).toBe('https://app.formaos.com.au');
  });

  it('trims whitespace', () => {
    expect(normalizeAppBase('  https://app.example.com  ')).toBe(
      'https://app.example.com',
    );
  });
});

describe('coerceEmailOtpType', () => {
  it('returns null for null input', () => {
    expect(coerceEmailOtpType(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(coerceEmailOtpType('')).toBeNull();
  });

  it('returns "signup" for "signup"', () => {
    expect(coerceEmailOtpType('signup')).toBe('signup');
  });

  it('returns "invite" for "invite"', () => {
    expect(coerceEmailOtpType('invite')).toBe('invite');
  });

  it('returns "recovery" for "Recovery" (case-insensitive)', () => {
    expect(coerceEmailOtpType('Recovery')).toBe('recovery');
  });

  it('returns null for unknown type', () => {
    expect(coerceEmailOtpType('unknown_type')).toBeNull();
  });

  it('handles all valid types', () => {
    for (const t of [
      'signup',
      'invite',
      'magiclink',
      'recovery',
      'email_change',
      'email',
    ]) {
      expect(coerceEmailOtpType(t)).toBe(t);
    }
  });
});

describe('parseSupabaseActionLink', () => {
  it('returns null for null input', () => {
    expect(parseSupabaseActionLink(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSupabaseActionLink('')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseSupabaseActionLink('not-a-url')).toBeNull();
  });

  it('parses token_hash and type from URL', () => {
    const result = parseSupabaseActionLink(
      'https://auth.example.com/verify?token_hash=abc123&type=signup',
    );
    expect(result).toEqual({
      tokenHash: 'abc123',
      type: 'signup',
      redirectTo: null,
    });
  });

  it('parses token param as fallback', () => {
    const result = parseSupabaseActionLink(
      'https://auth.example.com/verify?token=tok123&type=invite',
    );
    expect(result?.tokenHash).toBe('tok123');
  });

  it('parses redirect_to', () => {
    const result = parseSupabaseActionLink(
      'https://auth.example.com/verify?token_hash=abc&type=recovery&redirect_to=/dashboard',
    );
    expect(result?.redirectTo).toBe('/dashboard');
  });

  it('returns null type for unknown type', () => {
    const result = parseSupabaseActionLink(
      'https://auth.example.com/verify?token_hash=abc&type=invalid',
    );
    expect(result?.type).toBeNull();
  });
});

describe('buildHostedAuthConfirmLink', () => {
  it('returns null when no token and no action_link', () => {
    expect(buildHostedAuthConfirmLink({})).toBeNull();
  });

  it('builds link from hashed_token and verification_type', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'hash123',
        verification_type: 'signup',
      },
    });
    expect(link).toContain('/auth/confirm');
    expect(link).toContain('token_hash=hash123');
    expect(link).toContain('type=signup');
  });

  it('uses custom appBase', () => {
    const link = buildHostedAuthConfirmLink({
      appBase: 'https://custom.app.com',
      properties: { hashed_token: 'h', verification_type: 'invite' },
    });
    expect(link).toContain('https://custom.app.com');
  });

  it('includes redirect_to when provided', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'h',
        verification_type: 'recovery',
        redirect_to: '/settings',
      },
    });
    expect(link).toContain('redirect_to=%2Fsettings');
  });

  it('falls back to parsing action_link when no direct token', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        action_link:
          'https://auth.supabase.co/verify?token_hash=tok1&type=signup',
      },
    });
    expect(link).toContain('token_hash=tok1');
    expect(link).toContain('type=signup');
  });

  it('uses fallbackType and fallbackRedirectTo for action_link without token', () => {
    const link = buildHostedAuthConfirmLink({
      properties: {
        action_link: 'https://auth.supabase.co/verify',
      },
      fallbackType: 'invite',
      fallbackRedirectTo: '/accept',
    });
    expect(link).toContain('confirmation_url=');
    expect(link).toContain('type=invite');
    expect(link).toContain('redirect_to=%2Faccept');
  });
});
