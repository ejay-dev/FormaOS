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

/**
 * If the marketing site and app live on different subdomains of the same
 * parent (formaos.com.au + app.formaos.com.au), the OAuth state cookie must
 * be set on the parent domain — otherwise a user who clicks "Continue with
 * Google" while still on the marketing host has the cookie set host-only
 * there, and the post-OAuth callback on the app host can't read it back.
 * This is the dominant cause of "first attempt fails, second works" because
 * the error redirect lands the user back on the app host where the second
 * click sets the cookie correctly.
 */
function deriveParentDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (!siteUrl || !appUrl) return undefined;
  try {
    const siteHost = new URL(siteUrl).hostname;
    const appHost = new URL(appUrl).hostname;
    if (siteHost === appHost) return undefined;
    if (
      siteHost === 'localhost' ||
      appHost === 'localhost' ||
      siteHost.endsWith('.localhost') ||
      appHost.endsWith('.localhost')
    )
      return undefined;
    if (siteHost.endsWith('.vercel.app') || appHost.endsWith('.vercel.app'))
      return undefined;
    const partsA = siteHost.split('.');
    const partsB = appHost.split('.');
    const suffix: string[] = [];
    for (let i = 1; i <= Math.min(partsA.length, partsB.length); i += 1) {
      const a = partsA[partsA.length - i];
      const b = partsB[partsB.length - i];
      if (a !== b) break;
      suffix.unshift(a);
    }
    // Need at least an eTLD+1 (e.g. "formaos.com.au" → 3 parts, "example.com"
    // → 2 parts). Avoid setting Domain on a public suffix.
    if (suffix.length < 2) return undefined;
    return `.${suffix.join('.')}`;
  } catch {
    return undefined;
  }
}

export function persistOAuthStateCookie(state: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const domain = deriveParentDomain();

  const parts = [
    `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}`,
    `Max-Age=${OAUTH_STATE_TTL_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (isHttps) parts.push('Secure');

  document.cookie = parts.join('; ');
}

/**
 * Clear the state cookie using the same Domain attribute it was written
 * with. Without the matching Domain, the browser keeps a stale cookie
 * around alongside the host-only one, and subsequent attempts can read
 * the wrong value.
 */
export function clearOAuthStateCookie() {
  if (typeof document === 'undefined') return;
  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const domain = deriveParentDomain();
  const parts = [
    `${OAUTH_STATE_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (isHttps) parts.push('Secure');
  document.cookie = parts.join('; ');
}
