export const OAUTH_STATE_COOKIE_NAME = 'formaos_oauth_state';
export const OAUTH_STATE_TTL_SECONDS = 60 * 10;

export function buildGoogleOAuthRedirect(redirectTo: string) {
  const state = crypto.randomUUID();
  const url = new URL(redirectTo);
  url.searchParams.set('provider', 'google');
  url.searchParams.set('state', state);

  return {
    state,
    redirectTo: url.toString(),
  };
}

export function persistOAuthStateCookie(state: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie = [
    `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}`,
    `Max-Age=${OAUTH_STATE_TTL_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
    secure,
  ].join('; ');
}
