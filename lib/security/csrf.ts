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

  const envVars = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
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
  if (!trusted.has(requestOrigin)) {
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
