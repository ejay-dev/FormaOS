/**
 * Validated URL helpers for FormaOS.
 * Single source of truth for app URLs across marketing and app surfaces.
 */

const _appBase: string | null = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return null;
  }
})();

function isLoopbackHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

function isLoopbackUrl(url: string | null): boolean {
  if (!url) return false;

  try {
    return isLoopbackHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

function getBrowserLoopbackOrigin(appBase: string | null): string | null {
  if (typeof window === 'undefined' || !appBase) return null;

  try {
    const configured = new URL(appBase);
    const current = window.location;
    if (
      isLoopbackHost(configured.hostname) &&
      isLoopbackHost(current.hostname) &&
      configured.origin !== current.origin
    ) {
      return current.origin;
    }
  } catch {
    // Ignore invalid client URL state and fall back to configured app base.
  }

  return null;
}

/** Validated app base URL (origin only, no trailing slash). */
export function getAppBaseUrl(): string {
  const browserLoopbackOrigin = getBrowserLoopbackOrigin(_appBase);
  if (browserLoopbackOrigin) return browserLoopbackOrigin;
  if (_appBase) return _appBase;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://app.formaos.com.au';
}

export function getSignInUrl(): string {
  if (isLoopbackUrl(_appBase)) return '/auth/signin';
  return `${getAppBaseUrl()}/auth/signin`;
}

export function getSignUpUrl(params?: Record<string, string>): string {
  if (isLoopbackUrl(_appBase)) {
    const base = '/auth/signup';
    if (!params || Object.keys(params).length === 0) return base;
    const qs = new URLSearchParams(params).toString();
    return `${base}?${qs}`;
  }

  const base = `${getAppBaseUrl()}/auth/signup`;
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}
