import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { isFounder } from '@/lib/utils/founder';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/product',
  '/industries',
  '/security',
  '/pricing',
  '/our-story',
  '/contact',
  '/about',
  '/docs',
  '/blog',
  '/faq',
  '/legal/privacy',
  '/legal/terms',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
];

// Check if a path is a public route
function isPublicRoute(path: string): boolean {
  // Exact matches
  if (PUBLIC_ROUTES.includes(path)) {
    return true;
  }

  // Check for static assets
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/public/') ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({ request });
    const startTime = Date.now();

    const pathname = request.nextUrl.pathname;
    const logTiming = (label: string) => {
      if (pathname.startsWith('/app') || pathname.startsWith('/admin')) {
        const ms = Date.now() - startTime;
        console.log('[Middleware] timing', { label, path: pathname, ms });
      }
    };
    const redirectWithLoopGuard = (
      targetUrl: URL,
      userExists: boolean,
      reason: string,
    ) => {
      const LOOP_COUNT_PARAM = '__rl';
      const LOOP_TARGET_PARAM = '__rlt';
      const prevTarget = request.nextUrl.searchParams.get(LOOP_TARGET_PARAM);
      const prevCountRaw = request.nextUrl.searchParams.get(LOOP_COUNT_PARAM);
      const prevCount = prevCountRaw ? Number.parseInt(prevCountRaw, 10) : 0;
      const targetPath = targetUrl.pathname;
      const nextCount = prevTarget === targetPath ? prevCount + 1 : 1;

      if (Number.isFinite(nextCount) && nextCount > 2) {
        const safeUrl = request.nextUrl.clone();
        safeUrl.searchParams.delete(LOOP_COUNT_PARAM);
        safeUrl.searchParams.delete(LOOP_TARGET_PARAM);
        safeUrl.pathname = userExists ? '/onboarding' : '/auth/signin';
        console.warn('[Middleware] loop guard triggered', {
          path: pathname,
          targetPath,
          safePath: safeUrl.pathname,
          reason,
        });
        logTiming('loop-guard');
        return NextResponse.redirect(safeUrl);
      }

      targetUrl.searchParams.set(LOOP_COUNT_PARAM, String(nextCount));
      targetUrl.searchParams.set(LOOP_TARGET_PARAM, targetPath);
      logTiming('redirect');
      return NextResponse.redirect(targetUrl);
    };

    // 🚨 CRITICAL: Verify FOUNDER_EMAILS is loaded (log ONCE per deployment)
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      console.log('[Middleware] 🔧 ENV CHECK', {
        FOUNDER_EMAILS_RAW: process.env.FOUNDER_EMAILS,
        FOUNDER_USER_IDS_RAW: process.env.FOUNDER_USER_IDS,
        NODE_ENV: process.env.NODE_ENV,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const safeUrl = (value?: string) => {
      if (!value) return null;
      try {
        return new URL(value);
      } catch {
        return null;
      }
    };
    const appOrigin = safeUrl(appUrl);
    const siteOrigin = safeUrl(siteUrl);
    const host = request.nextUrl.hostname;

    const oauthCode = request.nextUrl.searchParams.get('code');
    const oauthState = request.nextUrl.searchParams.get('state');
    const oauthError = request.nextUrl.searchParams.get('error');

    // Handle OAuth redirects to root path - Google OAuth may not always include state
    if (oauthCode && pathname === '/') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/callback';
      // Preserve all search params for OAuth callback
      if (
        appOrigin &&
        siteOrigin &&
        request.nextUrl.hostname === siteOrigin.hostname &&
        appOrigin.hostname !== siteOrigin.hostname
      ) {
        redirectUrl.protocol = appOrigin.protocol;
        redirectUrl.host = appOrigin.host;
      }
      console.log('[Middleware] OAuth redirect:', {
        from: request.nextUrl.toString(),
        to: redirectUrl.toString(),
        hasState: !!oauthState,
        hasError: !!oauthError,
      });
      return NextResponse.redirect(redirectUrl);
    }

    // Handle /auth route - redirect to /auth/signin
    if (pathname === '/auth') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/signin';
      return redirectWithLoopGuard(redirectUrl, false, '/auth -> /auth/signin');
    }

    // Handle OAuth errors (user denied permission, etc.)
    if (oauthError && pathname === '/') {
      console.log('[Middleware] OAuth error detected:', oauthError);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/signin';
      redirectUrl.searchParams.set('error', 'oauth_cancelled');
      redirectUrl.searchParams.set(
        'message',
        'Sign in was cancelled. Please try again.',
      );
      return redirectWithLoopGuard(redirectUrl, false, 'oauth-error');
    }

    const isAuthPath = pathname === '/auth' || pathname.startsWith('/auth/');
    const isAdminPath = pathname.startsWith('/admin');
    const isAppPath = pathname.startsWith('/app');

    // Skip auth checks for public routes (after OAuth handling),
    // but allow /auth/* to continue so we can redirect signed-in users.
    if (isPublicRoute(pathname) && !isAuthPath) {
      logTiming('public');
      return response;
    }

    if (appOrigin && siteOrigin && appOrigin.hostname !== siteOrigin.hostname) {
      const appPaths = [
        '/app',
        '/admin',
        '/auth',
        '/onboarding',
        '/accept-invite',
        '/submit',
        '/signin',
        '/api',
      ];
      const isAppPath = appPaths.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );

      // Ensure /admin always stays on app domain
      if (pathname.startsWith('/admin') && host === siteOrigin.hostname) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = appOrigin.protocol;
        redirectUrl.host = appOrigin.host;
        return redirectWithLoopGuard(redirectUrl, false, 'admin-domain');
      }

      if (host === siteOrigin.hostname && isAppPath) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = appOrigin.protocol;
        redirectUrl.host = appOrigin.host;
        return redirectWithLoopGuard(redirectUrl, false, 'site->app-domain');
      }

      if (
        host === appOrigin.hostname &&
        !isAppPath &&
        !pathname.startsWith('/api')
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = siteOrigin.protocol;
        redirectUrl.host = siteOrigin.host;
        return redirectWithLoopGuard(redirectUrl, false, 'app->site-domain');
      }
    }

    if (!isAppPath && !isAdminPath) {
      logTiming('no-auth-check');
      return response;
    }

    const cookieDomain = getCookieDomain(request.nextUrl.hostname);
    const isHttps = request.nextUrl.protocol === 'https:';
    const isPresent = (value?: string | null) =>
      Boolean(value && value !== 'undefined' && value !== 'null');
    const supabaseUrl = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : '';
    const supabaseAnonKey = isPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : '';
    const hasValidSupabaseUrl = (() => {
      if (!supabaseUrl) return false;
      try {
        new URL(supabaseUrl);
        return true;
      } catch {
        return false;
      }
    })();
    const hasSupabaseEnv = Boolean(hasValidSupabaseUrl && supabaseAnonKey);

    if (!hasSupabaseEnv) {
      if (isAppPath || isAdminPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/signin';
        return redirectWithLoopGuard(url, false, 'missing-supabase-env');
      }
      logTiming('no-supabase-env');
      return response;
    }

    let user: { id: string; email?: string | null } | null = null;

    try {
      const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                const normalized = { ...options };
                if (!normalized.sameSite) {
                  normalized.sameSite = 'lax';
                }
                if (!normalized.path) {
                  normalized.path = '/';
                }
                if (isHttps) {
                  normalized.secure = true;
                }
                const cookieOptions = cookieDomain
                  ? { ...normalized, domain: cookieDomain }
                  : normalized;
                request.cookies.set(name, value);
                response.cookies.set(name, value, cookieOptions);
              });
            } catch {
              // Ignore cookie set errors in middleware
            }
          },
        },
      });

      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        user = data.user ?? null;
      }
    } catch (error) {
      console.error('[Middleware] Supabase init failed:', error);
      user = null;
    }

    // ============================================================
    // 🚨 STEP 1: DETECT FOUNDER - ABSOLUTE TOP PRIORITY
    // This MUST run before ANY other routing logic
    // ============================================================

    const userEmail = user?.email ?? '';
    const userId = user?.id ?? '';
    const isUserFounder = isFounder(userEmail, userId);

    // 🔍 FOUNDER DETECTION LOGGING (for /admin paths only)
    if (pathname.startsWith('/admin')) {
      console.log('[Middleware] 🔍 FOUNDER CHECK', {
        pathname,
        userEmail: userEmail ? userEmail.substring(0, 3) + '***' : 'none',
        userId: userId ? userId.substring(0, 8) + '...' : 'none',
        isFounder: isUserFounder,
        hasUser: !!user,
        FOUNDER_EMAILS_raw: process.env.FOUNDER_EMAILS,
        FOUNDER_USER_IDS_raw: process.env.FOUNDER_USER_IDS,
      });
    }

    // ============================================================
    // 🚨 STEP 2: SHORT-CIRCUIT /admin FOR FOUNDERS
    // If founder accessing /admin → ALLOW IMMEDIATELY, bypass ALL guards
    // ============================================================
    if (isAdminPath) {
      if (!user) {
        // Not authenticated → redirect to signin
        console.log('[Middleware] ❌ /admin requires authentication');
        const url = request.nextUrl.clone();
        url.pathname = '/auth/signin';
        return redirectWithLoopGuard(url, false, '/admin-unauth');
      }

      if (isUserFounder) {
        // ✅ FOUNDER → ALLOW ACCESS, bypass everything
        console.log('[Middleware] ✅ FOUNDER ACCESS GRANTED TO /admin', {
          email: userEmail ? userEmail.substring(0, 3) + '***' : 'none',
          path: pathname,
          redirecting: 'ALLOW (no redirect, founder gets access)',
        });
        logTiming('admin-allow');
        return response;
      } else {
        // ❌ NOT A FOUNDER → DENY ACCESS
        console.log('[Middleware] ❌ NON-FOUNDER BLOCKED FROM /admin', {
          email: userEmail ? userEmail.substring(0, 3) + '***' : 'none',
          redirectTo: '/unauthorized',
        });
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return redirectWithLoopGuard(url, true, '/admin-non-founder');
      }
    }

    // ============================================================
    // STEP 3: BLOCK OTHER PROTECTED ROUTES IF NOT LOGGED IN
    // ============================================================
    if (!user && isAppPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      return redirectWithLoopGuard(url, false, '/app-unauth');
    }

    // -------------------------------
    // 6. SECURITY HEADERS
    // -------------------------------
    // Add security headers to all responses
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
    );

    // -------------------------------
    // 7. ALLOW ONBOARDING ALWAYS
    // -------------------------------
    // No redirects here. Onboarding is handled inside the app.
    logTiming('allow');
    return response;
  } catch (err) {
    console.error('Middleware runtime error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that are explicitly public
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
