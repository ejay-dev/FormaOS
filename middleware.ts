/**
 * Root Next.js Middleware — Authentication Backstop
 *
 * Enforces authentication as a baseline for all protected routes.
 * This is a safety net; individual routes still perform their own
 * fine-grained permission checks.
 *
 * Responsibilities:
 *  1. Refresh Supabase session cookies on every request.
 *  2. Redirect unauthenticated users away from protected page routes.
 *  3. Return HTTP 401 for unauthenticated requests to protected API routes.
 *  4. Attach x-verified-ip header so downstream rate limiters trust the
 *     server-determined IP rather than a user-supplied x-forwarded-for.
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/**
 * Page route prefixes that require an authenticated session.
 * Unauthenticated requests are redirected to /auth/signin.
 */
const PROTECTED_PAGE_PREFIXES = ['/app', '/admin', '/onboarding', '/workspace-recovery'];

/**
 * API route prefixes that are publicly accessible without a session.
 * Everything else under /api/* requires authentication.
 */
const PUBLIC_API_PREFIXES = [
  '/api/health',
  '/api/auth',         // signup, email-signup, bootstrap, password, clear-session …
  '/api/billing/webhook',
  '/api/sso',          // SAML SSO initiation, ACS, metadata, discovery
  '/api/trust-packet', // public vendor trust document
  '/api/cron',
  '/api/automation/cron',
  '/api/scim',         // SCIM — uses bearer token auth, not session
  '/api/debug',        // guarded by ensureDebugAccess() inside each handler
  '/api/email',        // email preview / test (dev only)
  '/api/queue',        // internal queue processor
  '/api/frameworks/registry', // public framework registry
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPageRoute(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

/**
 * Return the best-effort client IP, preferring the edge-set
 * x-real-ip / cf-connecting-ip headers over the potentially
 * user-controlled x-forwarded-for chain.
 */
function getVerifiedIp(request: NextRequest): string {
  // Vercel sets x-real-ip; Cloudflare sets cf-connecting-ip
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a mutable response so the Supabase helper can set refreshed cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Attach server-verified IP for downstream rate limiters.
  const verifiedIp = getVerifiedIp(request);
  response.headers.set('x-verified-ip', verifiedIp);

  // ---------------------------------------------------------------------------
  // Session refresh
  // Create a Supabase client scoped to this request/response pair so the
  // SDK can read and write session cookies transparently.
  // ---------------------------------------------------------------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

  // If Supabase isn't configured (e.g. pure build phase) skip auth checks.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Rebuild the response so refreshed cookies are sent to the browser.
        response = NextResponse.next({
          request,
        });
        response.headers.set('x-verified-ip', verifiedIp);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth and refreshes the session
  // if the access token is expired. This is the recommended approach per the
  // @supabase/ssr docs to prevent session spoofing.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // Access enforcement
  // ---------------------------------------------------------------------------

  if (pathname.startsWith('/api/')) {
    // Handle CORS preflight for the public v1 REST API.
    if (pathname.startsWith('/api/v1/') && request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
          'Access-Control-Max-Age': '86400',
          'x-verified-ip': verifiedIp,
        },
      });
    }

    if (!isPublicApiRoute(pathname) && !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'x-verified-ip': verifiedIp } },
      );
    }
    return response;
  }

  if (isProtectedPageRoute(pathname) && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/auth/signin';
    // Preserve the intended destination so the sign-in page can redirect back.
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher: run middleware on all routes except static assets and Next.js
// internals.  Supabase session refresh should run on every real request.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static assets and Next.js internals:
     * - _next/static  : compiled JS/CSS bundles
     * - _next/image   : Next.js image optimisation endpoint
     * - favicon.ico   : browser favicon
     * - sitemap.xml   : search engine sitemap
     * - robots.txt    : crawl directives
     * - manifest.json : PWA web app manifest
     * - *.{ext}       : static files (images, fonts) served from /public
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)',
  ],
};
