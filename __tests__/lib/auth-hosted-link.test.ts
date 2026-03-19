/**
 * Unit tests for lib/auth/hosted-auth-link.ts
 *
 * Tests auth link generation utilities: normalizeAppBase, coerceEmailOtpType,
 * parseSupabaseActionLink, and buildHostedAuthConfirmLink.
 */

import {
  normalizeAppBase,
  coerceEmailOtpType,
  parseSupabaseActionLink,
  buildHostedAuthConfirmLink,
} from '@/lib/auth/hosted-auth-link';

describe('normalizeAppBase', () => {
  it('returns default when called with no arguments', () => {
    expect(normalizeAppBase()).toBe('https://app.formaos.com.au');
  });

  it('returns default when called with null', () => {
    expect(normalizeAppBase(null)).toBe('https://app.formaos.com.au');
  });

  it('returns default when called with empty string', () => {
    expect(normalizeAppBase('')).toBe('https://app.formaos.com.au');
  });

  it('strips trailing slash from valid URL', () => {
    expect(normalizeAppBase('https://staging.formaos.com.au/')).toBe(
      'https://staging.formaos.com.au',
    );
  });

  it('returns origin only (strips path)', () => {
    expect(normalizeAppBase('https://staging.formaos.com.au/some/path')).toBe(
      'https://staging.formaos.com.au',
    );
  });

  it('trims whitespace around valid URL', () => {
    expect(normalizeAppBase('  https://example.com  ')).toBe(
      'https://example.com',
    );
  });

  it('returns default for malformed URL', () => {
    expect(normalizeAppBase('not-a-url')).toBe('https://app.formaos.com.au');
  });
});

describe('coerceEmailOtpType', () => {
  it('returns null for null input', () => {
    expect(coerceEmailOtpType(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(coerceEmailOtpType(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(coerceEmailOtpType('')).toBeNull();
  });

  it('returns valid type for known value', () => {
    expect(coerceEmailOtpType('signup')).toBe('signup');
  });

  it('normalizes case to lowercase', () => {
    expect(coerceEmailOtpType('SIGNUP')).toBe('signup');
  });

  it('trims whitespace', () => {
    expect(coerceEmailOtpType('  recovery  ')).toBe('recovery');
  });

  it('returns null for unknown type', () => {
    expect(coerceEmailOtpType('unknown_type')).toBeNull();
  });

  it.each(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'])(
    'accepts known type "%s"',
    (type) => {
      expect(coerceEmailOtpType(type)).toBe(type);
    },
  );
});

describe('parseSupabaseActionLink', () => {
  it('returns null for null input', () => {
    expect(parseSupabaseActionLink(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseSupabaseActionLink(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSupabaseActionLink('')).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(parseSupabaseActionLink('not-a-url')).toBeNull();
  });

  it('extracts token_hash and type from valid action link', () => {
    const link =
      'https://auth.supabase.co/verify?token_hash=abc123&type=signup&redirect_to=/dashboard';
    const result = parseSupabaseActionLink(link);
    expect(result).toEqual({
      tokenHash: 'abc123',
      type: 'signup',
      redirectTo: '/dashboard',
    });
  });

  it('falls back to "token" param when "token_hash" is missing', () => {
    const link = 'https://auth.supabase.co/verify?token=xyz789&type=recovery';
    const result = parseSupabaseActionLink(link);
    expect(result).toEqual({
      tokenHash: 'xyz789',
      type: 'recovery',
      redirectTo: null,
    });
  });

  it('returns null type for unknown OTP type in link', () => {
    const link = 'https://auth.supabase.co/verify?token_hash=abc&type=bogus';
    const result = parseSupabaseActionLink(link);
    expect(result).toEqual({
      tokenHash: 'abc',
      type: null,
      redirectTo: null,
    });
  });

  it('returns nulls for missing query params', () => {
    const link = 'https://auth.supabase.co/verify';
    const result = parseSupabaseActionLink(link);
    expect(result).toEqual({
      tokenHash: null,
      type: null,
      redirectTo: null,
    });
  });
});

describe('buildHostedAuthConfirmLink', () => {
  it('returns null when no token or action link is available', () => {
    const result = buildHostedAuthConfirmLink({});
    expect(result).toBeNull();
  });

  it('builds confirm link from hashed_token and verification_type', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'tok123',
        verification_type: 'signup',
      },
    });
    expect(result).not.toBeNull();
    const url = new URL(result!);
    expect(url.pathname).toBe('/auth/confirm');
    expect(url.searchParams.get('token_hash')).toBe('tok123');
    expect(url.searchParams.get('type')).toBe('signup');
  });

  it('includes redirect_to when provided in properties', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'tok123',
        verification_type: 'invite',
        redirect_to: '/app/settings',
      },
    });
    const url = new URL(result!);
    expect(url.searchParams.get('redirect_to')).toBe('/app/settings');
  });

  it('uses custom appBase', () => {
    const result = buildHostedAuthConfirmLink({
      appBase: 'https://staging.formaos.com.au',
      properties: {
        hashed_token: 'tok123',
        verification_type: 'signup',
      },
    });
    const url = new URL(result!);
    expect(url.origin).toBe('https://staging.formaos.com.au');
  });

  it('extracts token from action_link when hashed_token is absent', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        action_link:
          'https://auth.supabase.co/verify?token_hash=fromLink&type=recovery',
      },
    });
    const url = new URL(result!);
    expect(url.searchParams.get('token_hash')).toBe('fromLink');
    expect(url.searchParams.get('type')).toBe('recovery');
  });

  it('falls back to fallbackType and fallbackRedirectTo', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'tok',
      },
      fallbackType: 'magiclink',
      fallbackRedirectTo: '/app/home',
    });
    const url = new URL(result!);
    expect(url.searchParams.get('type')).toBe('magiclink');
    expect(url.searchParams.get('redirect_to')).toBe('/app/home');
  });

  it('returns confirmation_url fallback when action_link has no extractable token', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        action_link: 'https://auth.supabase.co/opaque-link',
      },
      fallbackType: 'invite',
      fallbackRedirectTo: '/onboard',
    });
    expect(result).not.toBeNull();
    const url = new URL(result!);
    expect(url.searchParams.get('confirmation_url')).toBe(
      'https://auth.supabase.co/opaque-link',
    );
    expect(url.searchParams.get('type')).toBe('invite');
    expect(url.searchParams.get('redirect_to')).toBe('/onboard');
  });

  it('returns null when properties is null and no fallbacks', () => {
    const result = buildHostedAuthConfirmLink({ properties: null });
    expect(result).toBeNull();
  });

  it('prefers hashed_token over action_link token', () => {
    const result = buildHostedAuthConfirmLink({
      properties: {
        hashed_token: 'directToken',
        action_link:
          'https://auth.supabase.co/verify?token_hash=linkToken&type=signup',
        verification_type: 'signup',
      },
    });
    const url = new URL(result!);
    expect(url.searchParams.get('token_hash')).toBe('directToken');
  });
});
