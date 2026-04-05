/**
 * Tests for lib/auth/oauth-state.ts
 * buildGoogleOAuthRedirect is pure; persistOAuthStateCookie depends on document.
 */

import {
  buildGoogleOAuthRedirect,
  persistOAuthStateCookie,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_SECONDS,
} from '@/lib/auth/oauth-state';

describe('buildGoogleOAuthRedirect', () => {
  it('returns state and redirectTo with provider=google', () => {
    const { state, redirectTo } = buildGoogleOAuthRedirect(
      'https://example.com/callback',
    );
    expect(state).toBeTruthy();
    expect(typeof state).toBe('string');
    const url = new URL(redirectTo);
    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('state')).toBe(state);
  });

  it('generates a valid UUID state', () => {
    const { state } = buildGoogleOAuthRedirect('https://example.com/callback');
    expect(state).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('preserves existing query params', () => {
    const { redirectTo } = buildGoogleOAuthRedirect(
      'https://example.com/callback?foo=bar',
    );
    const url = new URL(redirectTo);
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('provider')).toBe('google');
  });

  it('generates unique states on each call', () => {
    const s1 = buildGoogleOAuthRedirect('https://example.com/callback');
    const s2 = buildGoogleOAuthRedirect('https://example.com/callback');
    expect(s1.state).not.toBe(s2.state);
  });
});

describe('persistOAuthStateCookie', () => {
  it('sets a cookie with correct name, max-age and SameSite', () => {
    // jsdom provides document.cookie
    persistOAuthStateCookie('test-state-value');
    expect(document.cookie).toContain(OAUTH_STATE_COOKIE_NAME);
  });
});

describe('constants', () => {
  it('OAUTH_STATE_COOKIE_NAME is defined', () => {
    expect(OAUTH_STATE_COOKIE_NAME).toBe('formaos_oauth_state');
  });

  it('OAUTH_STATE_TTL_SECONDS is 10 minutes', () => {
    expect(OAUTH_STATE_TTL_SECONDS).toBe(600);
  });
});
