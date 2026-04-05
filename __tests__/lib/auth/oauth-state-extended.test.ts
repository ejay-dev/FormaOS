/**
 * Tests for lib/auth/oauth-state.ts
 */

import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_SECONDS,
  buildGoogleOAuthRedirect,
  persistOAuthStateCookie,
} from '@/lib/auth/oauth-state';

describe('OAuth state constants', () => {
  it('cookie name is formaos_oauth_state', () => {
    expect(OAUTH_STATE_COOKIE_NAME).toBe('formaos_oauth_state');
  });

  it('TTL is 10 minutes', () => {
    expect(OAUTH_STATE_TTL_SECONDS).toBe(600);
  });
});

describe('buildGoogleOAuthRedirect', () => {
  it('returns state and redirectTo', () => {
    const result = buildGoogleOAuthRedirect('https://example.com/callback');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('redirectTo');
  });

  it('state is a valid UUID', () => {
    const { state } = buildGoogleOAuthRedirect('https://example.com');
    expect(state).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('redirectTo includes provider=google param', () => {
    const { redirectTo } = buildGoogleOAuthRedirect('https://example.com/auth');
    const url = new URL(redirectTo);
    expect(url.searchParams.get('provider')).toBe('google');
  });

  it('redirectTo includes state param', () => {
    const result = buildGoogleOAuthRedirect('https://example.com/auth');
    const url = new URL(result.redirectTo);
    expect(url.searchParams.get('state')).toBe(result.state);
  });

  it('generates unique states per call', () => {
    const a = buildGoogleOAuthRedirect('https://example.com');
    const b = buildGoogleOAuthRedirect('https://example.com');
    expect(a.state).not.toBe(b.state);
  });
});

describe('persistOAuthStateCookie', () => {
  it('is a no-op in non-browser environment', () => {
    // document is undefined in Node.js test
    expect(() => persistOAuthStateCookie('test-state')).not.toThrow();
  });
});
