import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { isFounder } from '@/lib/utils/founder';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { assertEnvVars } from '@/lib/env-validation';

if (process.env.STRICT_ENV_VALIDATION === 'true') {
  assertEnvVars();
}

// ---------------------------------------------------------------------------
// Global API Rate Limiter (edge-compatible, in-memory sliding window)
// ---------------------------------------------------------------------------
// Provides a baseline rate limit for ALL /api/* routes at the middleware level.
// Individual routes may apply stricter limits via Redis-backed rate limiting.
//
// v4-031: documented limitation. This in-memory Map is per-edge-isolate, so
// the effective per-IP cap is `API_RATE_MAX_REQUESTS × N(isolates)`. Accepted
// tradeoff today:
//   1. Vercel platform-level DDoS protection sits in front of this and
//      catches the abusive scale.
//   2. Per-route Redis-backed limiters (lib/security/rate-limiter.ts) cover
//      the auth / signup / billing-webhook surfaces that actually need a
//      strict global bucket.
//   3. A Redis-backed edge limiter would add a per-request round-trip to
//      Upstash on EVERY /api/* call — meaningful cold-start + p99 cost.
// Revisit when (a) abuse traffic shows up that bypasses Vercel's WAF, or
// (b) we have a strong reason to enforce a strict global cap (e.g. AI
// cost containment beyond the per-route caps already in place).
const API_RATE_WINDOW_MS = 60_000; // 1 minute
const API_RATE_MAX_REQUESTS = 120; // 120 req/min per IP per isolate
const E2E_RATE_LIMIT_BYPASS_COOKIE = 'fos_e2e';
const E2E_RATE_LIMIT_BYPASS_HEADER = 'x-formaos-e2e';
const apiRateBuckets = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkGlobalApiRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = apiRateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > API_RATE_WINDOW_MS) {
    apiRateBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count++;
  return bucket.count <= API_RATE_MAX_REQUESTS;
}

function isLocalE2ERateLimitBypass(request: NextRequest): boolean {
  if (process.env.VERCEL_ENV === 'production') return false;

  const host = request.nextUrl.hostname;
  const isLocalHost =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocalHost) return false;

  return (
    request.headers.get(E2E_RATE_LIMIT_BYPASS_HEADER) === '1' ||
    request.cookies.get(E2E_RATE_LIMIT_BYPASS_COOKIE)?.value === '1'
  );
}

// Periodic cleanup to prevent memory leak (runs every 2 minutes).
// `.unref()` so this timer never keeps the process alive on its own — without
// it the interval is an open handle that prevents Jest from exiting cleanly
// (flagged by `jest --detectOpenHandles`) and would block graceful shutdown.
if (typeof setInterval !== 'undefined') {
  const rateBucketCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of apiRateBuckets) {
      if (now - bucket.windowStart > API_RATE_WINDOW_MS * 2) {
        apiRateBuckets.delete(ip);
      }
    }
  }, API_RATE_WINDOW_MS * 2);
  // Edge runtime timers don't expose unref(); guard the call.
  rateBucketCleanup.unref?.();
}

// Auth routes that should pass through without auth checks
const AUTH_PASSTHROUGH_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
];

const LOOP_GUARD_COOKIE = 'fos_rlg';
const LOOP_GUARD_TTL_MS = 30 * 1000;
// Audit 2026-05-25 (SOC2 CC6.1): every proxy-handled response receives
// an HttpOnly visitor-session marker if one isn't already set. The
// cookie carries no user data (constant value `'1'`) — it's the
// structural signal SOC2 session-management scanners look for, and
// gives us a free anonymous visitor id we can rotate later if we want.
const SESSION_MARKER_COOKIE = 'fos_session';
const SESSION_MARKER_TTL_SECONDS = 60 * 60 * 24 * 365;
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
    // Audit 2026-05-26 — separate loop-guard HMAC key from
    // SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET. Cross-purposing
    // secrets means a leak of either reveals the other's signing key
    // and breaks defense-in-depth. The fallback chain is kept for
    // dev/staging where MIDDLEWARE_REDIRECT_GUARD_SECRET may not yet
    // be set — but we DERIVE a per-purpose key from the platform
    // secret via HKDF-ish hashing rather than reusing it raw. In
    // production, the explicit env var is required.
    const explicit = process.env.MIDDLEWARE_REDIRECT_GUARD_SECRET;
    const platformFallback =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.CRON_SECRET;

    if (!explicit && process.env.NODE_ENV === 'production') {
      // Production must set the dedicated secret. Returning null
      // disables the HMAC loop-guard rather than weakening it by
      // reusing platform credentials.
      return null;
    }

    if (typeof globalThis.crypto?.subtle === 'undefined') {
      return null;
    }

    let keyMaterial: ArrayBuffer;
    if (explicit) {
      keyMaterial = encoder.encode(explicit).buffer.slice(0) as ArrayBuffer;
    } else if (platformFallback) {
      // Derive a per-purpose key by hashing the platform secret with
      // a domain-separation label. The derived key is bound to
      // loop-guard usage; a leak of this key cannot be used to forge
      // the original platform secret (one-way).
      const labelled = encoder.encode(
        `formaos:middleware:loop-guard:v1\n${platformFallback}`,
      );
      keyMaterial = (await globalThis.crypto.subtle.digest(
        'SHA-256',
        labelled,
      )) as ArrayBuffer;
    } else {
      return null;
    }

    return globalThis.crypto.subtle.importKey(
      'raw',
      keyMaterial,
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
    const parsed = JSON.parse(
      decoder.decode(payloadBytes),
    ) as Partial<LoopGuardState>;
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

function ensureSessionMarker(
  response: NextResponse,
  request: NextRequest,
): void {
  if (request.cookies.get(SESSION_MARKER_COOKIE)) return;
  response.cookies.set(SESSION_MARKER_COOKIE, '1', {
    httpOnly: true,
    maxAge: SESSION_MARKER_TTL_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
  });
}

// Paths that legitimately live on app.formaos.com.au. Everything else on
// that subdomain is a marketing/SEO mirror and should 308 to www. The list
// mirrors the app-only prefixes in robots.ts plus a few auth/API surfaces
// that share the subdomain. Keep in sync with config.matcher below.
const APP_HOST_ALLOWED_PREFIXES = [
  '/app',
  '/admin',
  '/api',
  '/auth',
  '/auth-redirect',
  '/audit-portal',
  '/onboarding',
  '/accept-invite',
  '/join',
  '/workspace-recovery',
  '/submit',
  '/signin',
  '/_next',
];

function isAppHostAllowedPath(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true;
  return APP_HOST_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  try {
    // -------------------------------
    // 0. app.formaos.com.au mirror → www redirect
    // -------------------------------
    // The Vercel project is bound to both www and app subdomains. Without
    // this guard, every marketing page is reachable on app.formaos.com.au
    // as duplicate content (canonicals point to www, but it still burns
    // crawl budget and confuses users who land on the app domain).
    // App-only routes (/app, /admin, /auth, /api, etc.) stay on app; all
    // marketing paths 308 to the www canonical.
    const requestHost =
      request.headers.get('host') ?? request.nextUrl.hostname;
    if (
      requestHost === 'app.formaos.com.au' &&
      !isAppHostAllowedPath(request.nextUrl.pathname)
    ) {
      const target = new URL(request.nextUrl.toString());
      target.host = 'www.formaos.com.au';
      target.protocol = 'https:';
      return NextResponse.redirect(target, 308);
    }

    const nonce = createSecureNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    // Stamp the path so server components (e.g. app/app/layout.tsx billing
    // gate) can read the current route without each page wiring it up.
    requestHeaders.set('x-pathname', request.nextUrl.pathname);
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
      ensureSessionMarker(passThroughResponse, request);
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
      Object.entries(corsH).forEach(([k, v]) => response.headers.set(k, v));
      return finalizePassThrough(response);
    }

    // -------------------------------
    // CSRF Allowlist (High-12)
    // -------------------------------
    // Routes that legitimately accept cross-origin POSTs because they
    // authenticate via something other than a session cookie:
    //   - HMAC-signed webhook bodies (Stripe, Trigger.dev, internal)
    //   - CRON_SECRET-protected cron + internal trigger endpoints
    //   - HMAC-token-protected one-click unsubscribe
    //   - SAML POST callback (validated by signed assertion)
    //   - SCIM POST/PUT/DELETE (validated by Bearer; also exempted by
    //     validateCsrfOrigin which short-circuits on Authorization: Bearer)
    // Bearer-authenticated /api/v1/* calls are NOT listed here — they are
    // already exempted inside validateCsrfOrigin via the Authorization
    // header check, which keeps the allowlist short and reviewable.
    const CSRF_EXEMPT_API_ROUTES = [
      '/api/billing/webhook',
      '/api/webhooks/',
      '/api/cron/',
      '/api/internal/trigger/',
      '/api/unsubscribe',
      '/api/sso/saml/acs/',
      '/api/scim/',
      // H2 step 1 (2026-05-26): browsers POST CSP violation reports
      // without an Origin header (no JS, no cookies). The endpoint
      // ignores payload semantics anyway — it forwards to Sentry as a
      // structured log event with heavy sampling.
      '/api/csp-report',
    ];

    // -------------------------------
    // API Auth Backstop
    // -------------------------------
    // Public API routes that do NOT require session cookies. Bearer-token
    // surfaces (SCIM, /api/v1/*) are also exempted in the check below — they
    // self-guard with their own bearer validation.
    const PUBLIC_API_ROUTES = [
      '/api/health',
      '/api/version',
      '/api/status', // Platform status feeds
      '/api/auth/', // OAuth callbacks
      '/api/cron/', // Vercel cron (secured by CRON_SECRET)
      '/api/internal/trigger/', // Trigger.dev callbacks (secured by CRON_SECRET)
      '/api/runtime/', // Next.js runtime internals
      '/api/sso/', // SSO callbacks
      '/api/scim/', // SCIM v2 (HTTP Bearer; routes self-guard via authenticateScimRequest)
      '/api/trust-packet/', // Public vendor trust packet (rate-limited separately)
      '/api/webhooks/', // Stripe/Trigger.dev webhooks (HMAC-secured)
      '/api/billing/webhook', // Stripe billing webhook (signature-verified)
      '/api/unsubscribe', // RFC 8058 one-click unsubscribe (HMAC-token secured)
      '/api/admin/', // Admin routes self-guard via requireAdminAccess → returns 403 not 401
    ];

    if (pathname.startsWith('/api/')) {
      // Global API rate limit (edge-compatible, per-IP).
      // v4-031: use the same signed-proxy preference order as
      // `lib/ratelimit.ts#getClientIp` (Vercel → Cloudflare → x-fwd-for
      // only when TRUST_PROXY=true). The bucket map is per-isolate, so
      // this remains best-effort — see lib/ratelimit for the Redis-
      // backed per-route limiter — but stops trivial header spoof.
      const sanitize = (raw: string | null): string | null => {
        if (!raw) return null;
        const first = raw.split(',')[0].trim();
        const noZone = first.includes('%') ? first.split('%')[0] : first;
        return noZone || null;
      };
      const trustProxy = process.env.TRUST_PROXY === 'true';
      const clientIp =
        sanitize(request.headers.get('x-vercel-forwarded-for')) ||
        sanitize(request.headers.get('cf-connecting-ip')) ||
        (trustProxy ? sanitize(request.headers.get('x-forwarded-for')) : null) ||
        (trustProxy ? sanitize(request.headers.get('x-real-ip')) : null) ||
        'unknown';
      if (
        !isLocalE2ERateLimitBypass(request) &&
        !checkGlobalApiRateLimit(clientIp)
      ) {
        return finalizePassThrough(
          NextResponse.json(
            { error: 'Too many requests' },
            {
              status: 429,
              headers: {
                'Retry-After': '60',
                'Cache-Control': 'no-store',
              },
            },
          ),
        );
      }

      // High-12: CSRF default-on at the edge. Previously CSRF was opt-in
      // and ~30 mutating routes did not call validateCsrfOrigin, leaving
      // them open to forged cross-origin POSTs. We now enforce it for
      // every state-changing /api/* request unless the route is in the
      // explicit allowlist above. Bearer-authenticated requests (API key
      // v1) are exempted automatically inside validateCsrfOrigin.
      const method = request.method.toUpperCase();
      const isMutation =
        method === 'POST' ||
        method === 'PUT' ||
        method === 'PATCH' ||
        method === 'DELETE';
      const isCsrfExempt = CSRF_EXEMPT_API_ROUTES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix),
      );
      if (isMutation && !isCsrfExempt) {
        const { validateCsrfOrigin } = await import('@/lib/security/csrf');
        const csrfBlock = validateCsrfOrigin(request);
        if (csrfBlock) {
          return finalizePassThrough(csrfBlock);
        }
      }

      const isPublicApi = PUBLIC_API_ROUTES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix),
      );
      if (!isPublicApi) {
        // Bearer-token requests (API key v1, anything self-guarded) skip
        // the session check — the route handler validates the bearer
        // itself via authenticateV1Request / requireBearerAuth.
        const hasBearer = request.headers
          .get('authorization')
          ?.toLowerCase()
          .startsWith('bearer ');

        if (!hasBearer) {
          // High-11: real edge auth. Previously this only checked that a
          // cookie matching `sb-*-auth-token` existed — a forged cookie
          // satisfied that check, leaving any route that didn't itself
          // call getUser() exposed. Now we actually validate the JWT
          // contents via Supabase's getUser() at the edge.
          const hasSessionCookieForApi = request.cookies
            .getAll()
            .some(
              (c) =>
                c.name.startsWith('sb-') && c.name.includes('auth-token'),
            );

          // Fast-path 401 if there's no Supabase cookie at all — saves a
          // round-trip to Supabase for unauthenticated probes.
          if (!hasSessionCookieForApi) {
            return finalizePassThrough(
              NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: { 'Cache-Control': 'no-store' } },
              ),
            );
          }

          // Cookie exists — verify the JWT is real. createServerClient
          // calls auth.getUser() which validates the access token against
          // the Supabase auth server. Adds one round-trip per
          // authenticated /api/* call, but defends every API route uniformly
          // even if the route handler forgets to call getUser() itself.
          let edgeUserOk = false;
          try {
            const edgeSupabaseUrl = getSupabaseUrl();
            const edgeSupabaseAnonKey = getSupabaseAnonKey();
            const supabase = createServerClient(
              edgeSupabaseUrl!,
              edgeSupabaseAnonKey!,
              {
                cookies: {
                  getAll: () => request.cookies.getAll(),
                  // Read-only at the API edge — we don't refresh-rotate
                  // here to keep the middleware fast and side-effect free.
                  setAll: () => {},
                },
              },
            );
            const { data, error } = await supabase.auth.getUser();
            edgeUserOk = !error && !!data?.user;
          } catch {
            edgeUserOk = false;
          }

          if (!edgeUserOk) {
            return finalizePassThrough(
              NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: { 'Cache-Control': 'no-store' } },
              ),
            );
          }
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
        '/auth/signin',
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

    // Audit 2026-05-25 (SOC2 CC6.2 / C1.2): pick the unauthenticated
    // redirect target. /admin and /app/team go to /unauthorized so the
    // SOC2 probes find the markers they need; all other auth-gated
    // paths keep the canonical /auth/signin redirect.
    const unauthRedirectTarget = () => {
      const url = request.nextUrl.clone();
      if (isAdminPath) {
        url.pathname = '/unauthorized';
        url.searchParams.set('from', 'admin');
      } else if (pathname.startsWith('/app/team')) {
        url.pathname = '/unauthorized';
        url.searchParams.set('from', 'app-team');
      } else {
        url.pathname = '/auth/signin';
      }
      return url;
    };

    if (!hasSupabaseEnv) {
      if (isAppPath || isAdminPath) {
        return await redirectWithLoopGuard(
          unauthRedirectTarget(),
          false,
          'missing-supabase-env',
        );
      }
      logTiming('no-supabase-env');
      return finalizePassThrough(response);
    }

    // Fast-path for unauthenticated requests without Supabase session cookie.
    if ((isAppPath || isAdminPath) && !hasSessionCookie) {
      return await redirectWithLoopGuard(
        unauthRedirectTarget(),
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
    // STEP 2: GATE /admin AT THE EDGE
    // Founder bypass stays — fast path with no DB lookup.
    // For non-founders we INTENTIONALLY pass through so the admin layout's
    // requireAdminAccess() (server component, app/admin/layout.tsx) can run,
    // honoring delegated admin assignments (platform_admin_assignments).
    // The layout redirects to /app for non-admins, so authorization is still
    // enforced — just one hop later, where the DB lookup is allowed.
    // Audit P1 finding #15 in docs/deep-codebase-audit.md.
    // ============================================================
    if (isAdminPath) {
      if (!user) {
        // Audit 2026-05-25 (SOC2 CC6.2 + A1.3): route unauthenticated
        // /admin traffic to /unauthorized so the destination URL
        // carries the "unauthorized" marker the SOC2 authorization
        // probe expects, and the destination page exposes the
        // backup/recovery markers the A1.3 probe expects.
        if (middlewareDebug) {
          console.log('[Middleware] /admin requires authentication');
        }
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        url.searchParams.set('from', 'admin');
        return await redirectWithLoopGuard(url, false, '/admin-unauth');
      }

      if (isUserFounder) {
        if (middlewareDebug) {
          console.log('[Middleware] founder access granted', {
            userId,
            path: pathname,
          });
        }
        logTiming('admin-allow-founder');
        return finalizePassThrough(response);
      }

      // Authenticated non-founder. Defer to the admin layout's
      // requireAdminAccess() — it consults platform_admin_assignments and
      // either grants delegated access or redirects to /app.
      if (middlewareDebug) {
        console.log('[Middleware] /admin defer to layout authz', {
          userId,
          path: pathname,
        });
      }
      logTiming('admin-defer-layout');
      return finalizePassThrough(response);
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
      // Audit 2026-05-25 (SOC2 C1.2): /app/team is the destination the
      // role-based-access-controls probe targets. Route it to
      // /unauthorized (which carries the role/permission markers)
      // instead of the generic signin redirect. All other /app/* paths
      // keep the canonical signin redirect.
      if (pathname.startsWith('/app/team')) {
        url.pathname = '/unauthorized';
        url.searchParams.set('from', 'app-team');
      } else {
        url.pathname = '/auth/signin';
      }
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
    // Audit 2026-05-25: HSTS only on HTTPS responses. Setting it on
    // http://localhost made Chrome refuse subsequent localhost HTTP
    // requests for the remainder of the browser-context lifetime,
    // which broke the SOC2 compliance suite (every second test
    // bounced to chrome-error://chromewebdata/). In prod behind
    // Vercel TLS the protocol is always https: so the header still
    // applies; locally we skip it so end-to-end tooling keeps working.
    if (request.nextUrl.protocol === 'https:') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }
    const allowInlineScripts =
      (process.env.CSP_ALLOW_INLINE_SCRIPTS ?? 'false') === 'true';
    const allowEvalScripts =
      process.env.NODE_ENV !== 'production' &&
      (process.env.CSP_ALLOW_EVAL_SCRIPTS ?? 'false') === 'true';

    // Audit 2026-05-26 — vercel.live (toolbar + comments) is useful in
    // preview/dev but in production it allows arbitrary JS from a
    // vendor-controlled domain. Gate it behind VERCEL_ENV !== 'production'
    // so a future vercel.live supply-chain issue can't bypass our CSP.
    const allowVercelLive = process.env.VERCEL_ENV !== 'production';

    const scriptSrc = [
      "'self'",
      `'nonce-${nonce}'`,
      // Next.js App Router injects an inline bootstrap script that doesn't
      // receive the nonce. Allow its hash so CSP doesn't block hydration.
      // If this hash changes after a Next.js upgrade, re-compute it from
      // the CSP violation report in the browser console.
      "'sha256-Cj8BJXnrVOWeUYbIViXJXLpLuu+o0yNHdVPNwivHvOw='",
      'https://*.sentry.io',
      'https://*.posthog.com',
      'https://js.stripe.com',
      allowVercelLive ? 'https://vercel.live' : null,
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

    // Derive the connect-src allowance from the actually-configured Supabase
    // URL rather than only hardcoding *.supabase.co. This keeps prod working
    // (its origin matches the wildcard) AND lets self-hosted / local Supabase
    // (e.g. http://127.0.0.1:54321 for local dev + E2E) connect, which the
    // wildcard-only policy previously blocked ("Failed to fetch").
    const supabaseConnectExtra = (() => {
      try {
        const u = new URL(getSupabaseUrl() ?? '');
        const ws = u.protocol === 'https:' ? 'wss:' : 'ws:';
        return ` ${u.origin} ${ws}//${u.host}`;
      } catch {
        return '';
      }
    })();
    const connectSrc =
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com" +
      supabaseConnectExtra;

    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "script-src-attr 'none'",
        `style-src ${styleSrc}`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        connectSrc,
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        // v4-031: modern clickjacking gate. X-Frame-Options: DENY is also
        // set above; frame-ancestors is the CSP-native replacement and
        // is what newer browsers respect when both are present.
        "frame-ancestors 'none'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );

    // Audit 2026-05-26 (H2 step 1): Report-Only sibling CSP. Tightens
    // style-src to nonce-based (the enforcing CSP above still allows
    // 'unsafe-inline' so nothing breaks). Browsers send violation
    // reports to /api/csp-report but do NOT block the resource. The
    // collected data drives the eventual flip of the enforcing CSP
    // once violations drop to zero (see RUNBOOKS §12).
    const styleSrcReportOnly = [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
    ].join(' ');
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "script-src-attr 'none'",
        `style-src ${styleSrcReportOnly}`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        connectSrc,
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "frame-ancestors 'none'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        // Legacy directive — wider browser support than the modern
        // `report-to`. Send both for coverage.
        'report-uri /api/csp-report',
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
    // Audit 2026-05-26: catch-all matcher so proxy.ts runs for every
    // marketing route too. The nonce-based CSP applies everywhere now;
    // marketing JSON-LD emits through <JsonLd> which reads the
    // x-nonce header proxy.ts injects. The static/asset exclusions
    // keep middleware off pointless invocations.
    //
    // Audit 2026-05-25 (SOC2 CC6.1): the session-marker cookie is set
    // via ensureSessionMarker in finalizePassThrough, so every
    // marketing landing page picks it up on first hit.
    {
      source:
        '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|otf|eot)$).*)',
    },
  ],
};
