import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';

/**
 * Centralized Next.js middleware for FormaOS.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session on every matched request (keeps cookies alive).
 *  2. Redirect unauthenticated users away from protected routes (/app/*, /admin/*).
 *  3. Redirect unauthenticated API callers on protected API routes with 401.
 *
 * Public routes (auth pages, marketing, webhooks, health, SCIM) are passed
 * through after the session refresh so cookies stay up-to-date even for
 * logged-in users browsing public pages.
 */

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/** Routes that never require authentication. */
const PUBLIC_PATH_PREFIXES = [
  '/auth/',
  '/api/auth/',
  '/api/health',
  '/api/version',
  '/api/billing/webhook',
  '/api/scim/',
] as const;

/** Protected app routes — redirect to sign-in when unauthenticated. */
const PROTECTED_PAGE_PREFIXES = ['/app', '/admin'] as const;

/** Protected API routes — respond with 401 when unauthenticated. */
const PROTECTED_API_PREFIXES = ['/api/v1/', '/api/admin/'] as const;

function isPublicRoute(pathname: string): boolean {
  // The root auth page itself is public.
  if (pathname === '/auth') return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  // If Supabase is not configured, allow the request through so the app can
  // render its own "not configured" state rather than an opaque redirect loop.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const requestHost = request.headers.get('host') ?? undefined;
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? '';
  const isHttps = (() => {
    if (forwardedProto) return forwardedProto === 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    return appUrl.startsWith('https://') || siteUrl.startsWith('https://');
  })();
  const cookieDomain =
    process.env.NODE_ENV === 'development'
      ? undefined
      : getCookieDomain(requestHost);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write cookies to the request so downstream server components see them.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Re-create response so the new request cookies propagate.
        supabaseResponse = NextResponse.next({ request });

        // Write cookies to the response so the browser persists them.
        cookiesToSet.forEach(({ name, value, options }) => {
          const normalized = { ...options };
          if (!normalized.sameSite) normalized.sameSite = 'lax' as const;
          if (!normalized.path) normalized.path = '/';
          if (isHttps) normalized.secure = true;
          if (cookieDomain) (normalized as Record<string, unknown>).domain = cookieDomain;
          supabaseResponse.cookies.set(name, value, normalized);
        });
      },
    },
  });

  // Always refresh the session. This call is intentionally not destructured to
  // `data` because we only need to know whether a user exists.  The important
  // side-effect is that the Supabase client writes refreshed tokens back into
  // cookies via the `setAll` callback above.
  //
  // IMPORTANT: Do NOT replace getUser() with getSession() — getUser() sends a
  // request to the Supabase Auth server and validates the JWT, whereas
  // getSession() only reads from local storage and can return stale/tampered
  // data.  See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes: let them through (session cookies are already refreshed).
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Protected pages: redirect to sign-in.
  if (!user && isProtectedPage(pathname)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/auth/signin';
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Protected API routes: respond with 401.
  if (!user && isProtectedApi(pathname)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  return supabaseResponse;
}

// ---------------------------------------------------------------------------
// Matcher — skip static assets and internal Next.js routes
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static (static files)
     *  - _next/image  (image optimization)
     *  - favicon.ico, sitemap.xml, robots.txt
     *  - Common static asset extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
