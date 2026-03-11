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

/** Validated app base URL (origin only, no trailing slash). */
export function getAppBaseUrl(): string {
  if (_appBase) return _appBase;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  throw new Error(
    'NEXT_PUBLIC_APP_URL is missing or invalid. Set it in your environment.',
  );
}

export function getSignInUrl(): string {
  return `${getAppBaseUrl()}/auth/signin`;
}

export function getSignUpUrl(params?: Record<string, string>): string {
  const base = `${getAppBaseUrl()}/auth/signup`;
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}
