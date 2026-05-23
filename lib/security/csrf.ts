/**
 * =========================================================
 * CSRF Protection
 * =========================================================
 *
 * Validates the Origin / Referer header on state-changing requests
 * to prevent cross-site request forgery. This is a server-side check
 * that works alongside SameSite=Lax cookies.
 *
 * Usage:
 * ```ts
 * import { validateCsrfOrigin } from '@/lib/security/csrf';
 *
 * export async function POST(request: Request) {
 *   const csrfError = validateCsrfOrigin(request);
 *   if (csrfError) return csrfError;
 *   // ... handler logic
 * }
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Trusted origins derived from environment config.
 * Returns a set of lowercase origin strings (e.g. "https://app.example.com").
 */
function getTrustedOrigins(): Set<string> {
  const origins = new Set<string>();

  // v4-023: VERCEL_URL / VERCEL_BRANCH_URL are populated on EVERY
  // Vercel deployment — including PR previews and per-branch
  // builds. Adding them unconditionally to the trusted-origin set
  // meant a preview deployment's origin was accepted against prod
  // cookies. Now we only trust the production deployment URL when
  // we know we're on the production Vercel environment
  // (VERCEL_ENV === 'production'), and only when no explicit
  // NEXT_PUBLIC_APP_URL is set.
  const vercelEnv = process.env.VERCEL_ENV;
  const isProdVercel = vercelEnv === 'production';

  const envVars = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    isProdVercel && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
    // Branch URL only trusted on the production environment (e.g.
    // the canonical `main` deployment); preview branches don't
    // qualify. VERCEL_BRANCH_URL on a preview points at the PR
    // build — explicitly untrusted.
    isProdVercel && process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
    ...(process.env.CSRF_TRUSTED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  for (const raw of envVars) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      origins.add(url.origin.toLowerCase());
    } catch {
      // skip invalid URLs
    }
  }

  // In development, always trust localhost
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return origins;
}

function isDevelopmentLoopbackOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Validate that a state-changing request originates from a trusted origin.
 *
 * Returns `null` if the request is valid, or a 403 NextResponse if the
 * Origin/Referer is missing or untrusted.
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 */
export function validateCsrfOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();

  // Safe methods don't need CSRF protection
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  // Bearer-token authenticated requests cannot be forged by a malicious
  // origin: the browser will not attach Authorization headers to a
  // cross-origin request from JS unless the call site explicitly opts in
  // via fetch options, and that flow doesn't carry the user's session
  // cookies anyway. Skip CSRF for these so /api/v1 routes can be safely
  // called by API-key clients (server-to-server, mobile, etc.) where no
  // Origin/Referer is sent.
  const authorization = request.headers.get('authorization');
  if (authorization && /^bearer\s+\S/i.test(authorization)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Derive origin string from the Origin header, or fall back to Referer
  let requestOrigin: string | null = null;
  if (origin) {
    requestOrigin = origin.toLowerCase();
  } else if (referer) {
    try {
      requestOrigin = new URL(referer).origin.toLowerCase();
    } catch {
      // malformed referer
    }
  }

  if (!requestOrigin) {
    console.warn('[CSRF] Blocked request with no Origin/Referer header', {
      method,
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Forbidden: missing origin' },
      { status: 403 },
    );
  }

  const trusted = getTrustedOrigins();
  if (!trusted.has(requestOrigin) && !isDevelopmentLoopbackOrigin(requestOrigin)) {
    console.warn('[CSRF] Blocked request from untrusted origin', {
      requestOrigin,
      method,
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Forbidden: untrusted origin' },
      { status: 403 },
    );
  }

  return null;
}
