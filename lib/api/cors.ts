/**
 * CORS helpers for FormaOS public REST API v1 (/api/v1/*)
 *
 * Usage in route handlers:
 *   import { getCorsHeaders, optionsResponse } from '@/lib/api/cors';
 *
 *   // Preflight
 *   export async function OPTIONS(req: Request) { return optionsResponse(req); }
 *
 *   // Normal response — spread getCorsHeaders(req) into NextResponse
 *   return NextResponse.json(data, { headers: getCorsHeaders(req) });
 */

const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization';
const MAX_AGE = '86400';

/**
 * Build the allowed-origins list from environment.
 * Always includes the app and marketing domains.
 * Additional origins can be added via CORS_ALLOWED_ORIGINS (comma-separated).
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (appUrl) origins.push(new URL(appUrl).origin);
  if (siteUrl) origins.push(new URL(siteUrl).origin);

  const extra = process.env.CORS_ALLOWED_ORIGINS;
  if (extra) {
    for (const o of extra.split(',')) {
      const trimmed = o.trim();
      if (trimmed) origins.push(trimmed);
    }
  }

  return [...new Set(origins)];
}

/**
 * Returns the Access-Control-Allow-Origin value for a given request.
 * - If the request Origin matches an allowed origin, reflect it back.
 * - In development (localhost), allow any origin for convenience.
 * - Otherwise, return the primary app URL (restrictive default).
 */
function resolveOrigin(request?: Request | null): string {
  const origin = request?.headers?.get('origin');
  const allowed = getAllowedOrigins();

  // Reflect matching origin
  if (origin && allowed.includes(origin)) {
    return origin;
  }

  // Allow localhost in development
  if (origin && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return origin;
  }

  // Restrictive default: first allowed origin or the app URL
  return allowed[0] || process.env.NEXT_PUBLIC_APP_URL || 'https://app.formaos.com.au';
}

export function getCorsHeaders(request?: Request | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(request),
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': MAX_AGE,
    Vary: 'Origin',
  };
}

/** @deprecated Use getCorsHeaders(request) for origin-aware CORS */
export const corsHeaders = getCorsHeaders();

export function optionsResponse(request?: Request | null): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
