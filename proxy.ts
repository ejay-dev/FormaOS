import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { isFounder } from '@/lib/utils/founder';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { assertEnvVars } from '@/lib/env-validation';

if (process.env.STRICT_ENV_VALIDATION === 'true') {
  assertEnvVars();
}

// Auth routes that should pass through without auth checks
const AUTH_PASSTHROUGH_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
];

const LOOP_GUARD_COOKIE = 'fos_rlg';
const LOOP_GUARD_TTL_MS = 30 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type LoopGuardState = {
  count: number;
  expiresAt: number;
  targetPath: string;
};

function createSecureNonce(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  throw new Error('Secure random source unavailable for CSP nonce generation');
}

function encodeBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

let loopGuardKeyPromise: Promise<CryptoKey | null> | null = null;

async function getLoopGuardKey(): Promise<CryptoKey | null> {
  if (loopGuardKeyPromise) {
    return loopGuardKeyPromise;
  }

  loopGuardKeyPromise = (async () => {
    const secret =
      process.env.MIDDLEWARE_REDIRECT_GUARD_SECRET ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.CRON_SECRET;

    if (!secret || typeof globalThis.crypto?.subtle === 'undefined') {
      return null;
    }

    return globalThis.crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  })();

  return loopGuardKeyPromise;
}

async function signLoopGuardPayload(payload: string): Promise<string | null> {
  const key = await getLoopGuardKey();
  if (!key) {
    return null;
  }

  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );
  return encodeBase64Url(new Uint8Array(signature));
}

async function serializeLoopGuardState(
  state: LoopGuardState,
): Promise<string | null> {
  const payload = encodeBase64Url(encoder.encode(JSON.stringify(state)));
  const signature = await signLoopGuardPayload(payload);
  if (!signature) {
    return null;
  }

  return `${payload}.${signature}`;
}

async function parseLoopGuardState(
  rawValue: string | undefined,
): Promise<LoopGuardState | null> {
  if (!rawValue) {
    return null;
  }

  const [payload, signature] = rawValue.split('.');
  if (!payload || !signature) {
    return null;
  }

  const key = await getLoopGuardKey();
  if (!key || typeof globalThis.crypto?.subtle === 'undefined') {
    return null;
  }

  const signatureBytes = decodeBase64Url(signature);
  if (!signatureBytes) {
    return null;
  }

  const isValid = await globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(signatureBytes),
    encoder.encode(payload),
  );

  if (!isValid) {
    return null;
  }

  const payloadBytes = decodeBase64Url(payload);
  if (!payloadBytes) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoder.decode(payloadBytes)) as Partial<LoopGuardState>;
    if (
      typeof parsed.count !== 'number' ||
      !Number.isFinite(parsed.count) ||
      parsed.count < 0 ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt <= Date.now() ||
      typeof parsed.targetPath !== 'string' ||
      !parsed.targetPath.startsWith('/')
    ) {
      return null;
    }

    return {
      count: parsed.count,
      expiresAt: parsed.expiresAt,
      targetPath: parsed.targetPath,
    };
  } catch {
    return null;
  }
}

function setLoopGuardCookie(
  response: NextResponse,
  request: NextRequest,
  value: string | null,
): void {
  const secure = request.nextUrl.protocol === 'https:';

  response.cookies.set(LOOP_GUARD_COOKIE, value ?? '', {
    httpOnly: true,
    maxAge: value ? LOOP_GUARD_TTL_MS / 1000 : 0,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

export async function proxy(request: NextRequest) {
  try {
    const nonce = createSecureNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    const startTime = Date.now();
    const priorLoopGuardState = await parseLoopGuardState(
      request.cookies.get(LOOP_GUARD_COOKIE)?.value,
    );

    const pathname = request.nextUrl.pathname;
    const finalizePassThrough = (passThroughResponse: NextResponse) => {
      setLoopGuardCookie(passThroughResponse, request, null);
      passThroughResponse.headers.set(
        'Server-Timing',
        `mw;dur=${Date.now() - startTime}`,
      );
      return passThroughResponse;
    };

    // -------------------------------
    // CORS — Public REST API v1
    // -------------------------------
    // These routes use Bearer-token auth, not cookie sessions.
    // Handle OPTIONS preflight immediately before any auth logic.
    if (pathname.startsWith('/api/v1/')) {
      const { getCorsHeaders } = await import('@/lib/api/cors');
      const corsH = getCorsHeaders(request);
      if (request.method === 'OPTIONS') {
        return finalizePassThrough(
          new NextResponse(null, { status: 204, headers: corsH }),
        );
      }
      Object.entries(corsH).forEach(([k, v]) =>
        response.headers.set(k, v),
      );
      return finalizePassThrough(response);
    }

    // -------------------------------
    // API Auth Backstop
    // -------------------------------
    // Public API routes that do NOT require session cookies.
    // Everything else under /api/* must have a valid session.
    const PUBLIC_API_ROUTES = [
      '/api/health',
      '/api/version',
      '/api/auth/', // OAuth callbacks
      '/api/cron/', // Vercel cron (secured by CRON_SECRET)
      '/api/internal/trigger/', // Trigger.dev callbacks (secured by CRON_SECRET)
      '/api/runtime/', // Next.js runtime internals
      '/api/sso/', // SSO callbacks
    ];

    if (pathname.startsWith('/api/')) {
      const isPublicApi = PUBLIC_API_ROUTES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix),
      );
      if (!isPublicApi) {
        // Require a session cookie for non-public API routes
        const hasSessionCookieForApi = request.cookies
          .getAll()
          .some(
            (c) => c.name.startsWith('sb-') && c.name.includes('auth-token'),
          );
        if (!hasSessionCookieForApi) {
          return finalizePassThrough(
            NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401, headers: { 'Cache-Control': 'no-store' } },
            ),
          );
        }
      }
      // API routes don't need further middleware processing (redirects, CSP, etc.)
      return finalizePassThrough(response);
    }

    const middlewareDebug = process.env.MIDDLEWARE_DEBUG === 'true';
    const serverTiming = () => `mw;dur=${Date.now() - startTime}`;
    const logTiming = (label: string) => {
      if (
        middlewareDebug &&
        (pathname.startsWith('/app') || pathname.startsWith('/admin'))
      ) {
        const ms = Date.now() - startTime;
        console.log('[Middleware] timing', { label, path: pathname, ms });
      }
    };
    const redirectWithLoopGuard = async (
      targetUrl: URL,
      userExists: boolean,
      reason: string,
    ) => {
      const targetPath = targetUrl.pathname;
      const nextCount =
        priorLoopGuardState?.targetPath === targetPath
          ? priorLoopGuardState.count + 1
          : 1;

      if (Number.isFinite(nextCount) && nextCount > 2) {
        const safeUrl = request.nextUrl.clone();
        safeUrl.pathname = userExists ? '/onboarding' : '/auth/signin';
        console.warn('[Middleware] loop guard triggered', {
          path: pathname,
          targetPath,
          safePath: safeUrl.pathname,
          reason,
        });
        logTiming('loop-guard');
        const loopResponse = NextResponse.redirect(safeUrl);
        setLoopGuardCookie(loopResponse, request, null);
        loopResponse.headers.set('Server-Timing', serverTiming());
        return loopResponse;
      }

      logTiming('redirect');
      const redirectResponse = NextResponse.redirect(targetUrl);
      const signedState = await serializeLoopGuardState({
        count: nextCount,
        expiresAt: Date.now() + LOOP_GUARD_TTL_MS,
        targetPath,
      });
      setLoopGuardCookie(redirectResponse, request, signedState);
      redirectResponse.headers.set('Server-Timing', serverTiming());
      return redirectResponse;
    };

    // Environment variables are now validated at startup via lib/env-validation.ts
    // Individual route logging reduced to security events only

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

    // Handle /auth route - redirect to /auth/signin
    if (pathname === '/auth') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/signin';
      return await redirectWithLoopGuard(
        redirectUrl,
        false,
        '/auth -> /auth/signin',
      );
    }

    // 🔒 CRITICAL: Never intercept /auth/callback, /auth/signin, /auth/signup
    // These routes handle OAuth flows and must NOT be redirected or auth-checked.
    // Interfering here causes session-loss loops ("try again" errors).
    if (AUTH_PASSTHROUGH_ROUTES.includes(pathname)) {
      logTiming('auth-passthrough');
      return finalizePassThrough(response);
    }

    // Normalize legacy /app/* auth paths to /auth/*
    if (pathname === '/app/signup' || pathname === '/app/signin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        pathname === '/app/signup' ? '/auth/signup' : '/auth/signin';
      return await redirectWithLoopGuard(redirectUrl, false, 'legacy-app-auth');
    }

    const isAdminPath = pathname.startsWith('/admin');
    const isAppPath = pathname.startsWith('/app');
    const hasSessionCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));

    if (appOrigin && siteOrigin && appOrigin.hostname !== siteOrigin.hostname) {
      const appPaths = [
        '/app',
        '/admin',
        '/auth',
        '/onboarding',
        '/workspace-recovery',
        '/accept-invite',
        '/join',
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
        return await redirectWithLoopGuard(redirectUrl, false, 'admin-domain');
      }

      if (host === siteOrigin.hostname && isAppPath) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = appOrigin.protocol;
        redirectUrl.host = appOrigin.host;
        return await redirectWithLoopGuard(
          redirectUrl,
          false,
          'site->app-domain',
        );
      }

      if (
        host === appOrigin.hostname &&
        !isAppPath &&
        !pathname.startsWith('/api')
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = siteOrigin.protocol;
        redirectUrl.host = siteOrigin.host;
        return await redirectWithLoopGuard(
          redirectUrl,
          false,
          'app->site-domain',
        );
      }
    }

    if (!isAppPath && !isAdminPath) {
      logTiming('no-auth-check');
      return finalizePassThrough(response);
    }

    const cookieDomain = getCookieDomain(request.nextUrl.hostname);
    const isHttps = request.nextUrl.protocol === 'https:';
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
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
        return await redirectWithLoopGuard(
          url,
          false,
          'missing-supabase-env',
        );
      }
      logTiming('no-supabase-env');
      return finalizePassThrough(response);
    }

    // Fast-path for unauthenticated requests without Supabase session cookie.
    if ((isAppPath || isAdminPath) && !hasSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      return await redirectWithLoopGuard(
        url,
        false,
        'missing-session-cookie',
      );
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
      // Intentionally silent — auth errors are expected for unauthenticated routes.
    } catch {
      user = null;
    }

    // ============================================================
    // 🚨 STEP 1: DETECT FOUNDER - ABSOLUTE TOP PRIORITY
    // This MUST run before ANY other routing logic
    // ============================================================

    const userEmail = user?.email ?? '';
    const userId = user?.id ?? '';
    const isUserFounder = isFounder(userEmail, userId);

    // Optional strict middleware security mode. Kept off by default because
    // DB-backed checks on every request can cause auth latency/redirect churn.
    const enableStrictSessionSecurity =
      process.env.ENABLE_STRICT_SESSION_SECURITY === 'true';
    if (enableStrictSessionSecurity && middlewareDebug) {
      console.log('[Middleware] strict session security enabled');
    }

    // ============================================================
    // 🚨 STEP 2: SHORT-CIRCUIT /admin FOR FOUNDERS
    // If founder accessing /admin → ALLOW IMMEDIATELY, bypass ALL guards
    // ============================================================
    if (isAdminPath) {
      if (!user) {
        // Not authenticated → redirect to signin
        if (middlewareDebug) {
          console.log('[Middleware] /admin requires authentication');
        }
        const url = request.nextUrl.clone();
        url.pathname = '/auth/signin';
        return await redirectWithLoopGuard(url, false, '/admin-unauth');
      }

      if (isUserFounder) {
        // ✅ FOUNDER → ALLOW ACCESS, bypass everything
        if (middlewareDebug) {
          console.log('[Middleware] founder access granted', {
            userId,
            path: pathname,
          });
        }
        logTiming('admin-allow');
        return finalizePassThrough(response);
      } else {
        // ❌ NOT A FOUNDER → DENY ACCESS
        console.warn('[Middleware] non-founder blocked from /admin', {
          userId,
          redirectTo: '/unauthorized',
        });
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return await redirectWithLoopGuard(url, true, '/admin-non-founder');
      }
    }

    // ============================================================
    // STEP 3: BLOCK OTHER PROTECTED ROUTES IF NOT LOGGED IN
    // ============================================================
    if (!user && isAppPath) {
      if (middlewareDebug) {
        console.log('[Middleware] redirecting to /auth/signin', {
          reason: 'no-session',
          path: pathname,
          hasSessionCookie,
        });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      return await redirectWithLoopGuard(url, false, '/app-unauth');
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
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
    const allowInlineScripts =
      (process.env.CSP_ALLOW_INLINE_SCRIPTS ?? 'false') === 'true';
    const allowEvalScripts =
      process.env.NODE_ENV !== 'production' &&
      (process.env.CSP_ALLOW_EVAL_SCRIPTS ?? 'false') === 'true';

    const scriptSrc = [
      "'self'",
      `'nonce-${nonce}'`,
      'https://*.sentry.io',
      'https://*.posthog.com',
      'https://js.stripe.com',
      'https://vercel.live',
      allowInlineScripts ? "'unsafe-inline'" : null,
      allowEvalScripts ? "'unsafe-eval'" : null,
    ]
      .filter(Boolean)
      .join(' ');

    const styleSrc = [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ].join(' ');

    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "script-src-attr 'none'",
        `style-src ${styleSrc}`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );

    // -------------------------------
    // 7. ALLOW ONBOARDING ALWAYS
    // -------------------------------
    // No redirects here. Onboarding is handled inside the app.
    logTiming('allow');
    return finalizePassThrough(response);
  } catch (err) {
    console.error('Middleware runtime error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/app/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/onboarding/:path*',
    '/accept-invite/:path*',
    '/join/:path*',
    '/workspace-recovery/:path*',
    '/submit/:path*',
    '/signin/:path*',
    '/api/:path*',
  ],
};
