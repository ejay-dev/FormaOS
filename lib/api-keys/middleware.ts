import 'server-only';

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/ratelimit';
import { requireActiveSubscription } from '@/lib/billing/entitlements';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import {
  assertSessionNotRevoked,
  SessionRevokedError,
} from '@/lib/auth/session-revocation';
import { normalizeApiKeyScopes, type ApiKeyScope } from './scopes';
import {
  applyRateLimitHeaders,
  getSessionRateLimit,
  logApiKeyUsage,
  validateApiKey,
} from './manager';

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Status messages thrown by requireActiveSubscription; mapped to 402 responses.
const SUBSCRIPTION_REJECT_PREFIXES = [
  'Subscription inactive',
  'Subscription grace period expired',
  'Subscription plan invalid',
  'Subscription lookup failed',
];

function paymentRequiredResponse(reason: string) {
  return NextResponse.json(
    {
      error: reason,
      code: 'subscription_inactive',
      docs: 'https://app.formaos.com.au/app/billing',
    },
    { status: 402 },
  );
}

async function enforceActiveSubscription(orgId: string) {
  try {
    await requireActiveSubscription(orgId);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Subscription inactive';
    if (SUBSCRIPTION_REJECT_PREFIXES.some((prefix) => message.startsWith(prefix))) {
      return paymentRequiredResponse(message);
    }
    // Unexpected error shape — surface as 402 too so we fail-closed; downstream
    // observability (once obs-001 envs are set) will pick it up.
    return paymentRequiredResponse('Subscription inactive');
  }
}

export type V1AccessType = 'api_key' | 'session';

export interface V1AuthContext {
  accessType: V1AccessType;
  orgId: string;
  userId: string | null;
  role: string | null;
  apiKeyId: string | null;
  grantedScopes: ApiKeyScope[];
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: number;
  };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  db:
    | Awaited<ReturnType<typeof createSupabaseServerClient>>
    | ReturnType<typeof createSupabaseAdminClient>;
  request: Request;
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')?.trim() ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  return header.slice(7).trim() || null;
}

function isAdminRole(role: string | null | undefined) {
  return role === 'owner' || role === 'admin';
}

function hasCookie(request: Request, name: string, value: string) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${name}=${value}`);
}

function isLocalE2ERateLimitBypass(request: Request) {
  if (process.env.VERCEL_ENV === 'production') return false;

  const hostname = new URL(request.url).hostname;
  const isLocalHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (!isLocalHost) return false;

  return (
    request.headers.get('x-formaos-e2e') === '1' ||
    hasCookie(request, 'fos_e2e', '1')
  );
}

function sessionHasScopes(
  role: string | null,
  requiredScopes: ApiKeyScope[],
): boolean {
  if (isAdminRole(role)) {
    return true;
  }

  if (!role) {
    return requiredScopes.length === 0;
  }

  return requiredScopes.every((scope) => scope.endsWith(':read'));
}

async function getSessionMembership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  // P0-5 (2026-05-26): for multi-org users this previously did an
  // unfiltered `.maybeSingle()`, so the "active" org was whichever
  // row Postgres returned first — undefined order. Honour
  // user_preferences.current_organization_id (matches the canonical
  // resolveActiveMembership / getCachedUserMembership behaviour);
  // when no preference is set, pick the earliest membership so the
  // selection is stable across calls.
  const { data: preference } = await supabase
    .from('user_preferences')
    .select('current_organization_id')
    .eq('user_id', userId)
    .maybeSingle();
  const preferredOrgId =
    (preference as { current_organization_id?: string } | null)
      ?.current_organization_id ?? null;

  let modernQuery = supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (preferredOrgId) {
    modernQuery = modernQuery.eq('organization_id', preferredOrgId);
  }
  const modern = await modernQuery.maybeSingle();

  if (!modern.error && modern.data?.organization_id) {
    return {
      orgId: modern.data.organization_id as string,
      role: (modern.data.role as string | null) ?? null,
    };
  }

  // The legacy team_members fallback selects columns that don't exist in
  // the current migrations schema, so it returns an error and quietly
  // falls through to null for most users — kept defensively for any prod
  // installation where team_members carries an extended schema.
  const legacy = await supabase
    .from('team_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!legacy.error && legacy.data?.organization_id) {
    return {
      orgId: legacy.data.organization_id as string,
      role: (legacy.data.role as string | null) ?? null,
    };
  }

  return null;
}

export async function authenticateV1Request(
  request: Request,
  options: {
    requiredScopes?: ApiKeyScope[];
    requireAdmin?: boolean;
    allowSessionFallback?: boolean;
    /**
     * Default true. When true, requireActiveSubscription gates the request
     * — returns 402 for past_due/canceled/incomplete/incomplete_expired/
     * paused/unpaid orgs, and for expired pending_checkout/trialing grace
     * windows. Pass `false` only on endpoints that must work without an
     * active subscription (org onboarding, customer-portal redirects).
     */
    requireActiveSubscription?: boolean;
  } = {},
): Promise<
  | { ok: true; context: V1AuthContext }
  | { ok: false; response: NextResponse }
> {
  const requiredScopes = normalizeApiKeyScopes(options.requiredScopes ?? []);
  const subscriptionRequired = options.requireActiveSubscription !== false;
  const token = getBearerToken(request);
  const supabase = await createSupabaseServerClient();

  if (token?.startsWith('fos_')) {
    const validation = await validateApiKey(token, requiredScopes);
    if (!validation.ok || !validation.apiKey) {
      const response = NextResponse.json(
        { error: validation.error ?? 'Unauthorized' },
        { status: validation.status ?? 401 },
      );

      if (validation.resetAt !== undefined && validation.remaining !== undefined) {
        applyRateLimitHeaders(response, {
          limit: validation.apiKey?.rate_limit ?? 0,
          remaining: validation.remaining,
          resetAt: validation.resetAt,
        });
      }

      return { ok: false, response };
    }

    if (subscriptionRequired) {
      const blocked = await enforceActiveSubscription(validation.apiKey.org_id);
      if (blocked) {
        return { ok: false, response: blocked };
      }
    }

    return {
      ok: true,
      context: {
        accessType: 'api_key',
        orgId: validation.apiKey.org_id,
        userId: null,
        role: null,
        apiKeyId: validation.apiKey.id,
        grantedScopes: validation.apiKey.scopes,
        rateLimit: {
          limit: validation.apiKey.rate_limit,
          remaining: validation.remaining ?? 0,
          resetAt: validation.resetAt ?? Date.now() + 60_000,
        },
        supabase,
        db: createSupabaseAdminClient(),
        request,
      },
    };
  }

  if (options.allowSessionFallback === false) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized - API key required' },
        { status: 401 },
      ),
    };
  }

  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const user = userData?.user;

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      ),
    };
  }

  // P0-13 (2026-05-26): reject session-cookie auth on the v1 surface
  // when the user's session-revocation watermark is newer than the
  // JWT's iat. A demoted admin or kicked org member must not be able
  // to keep using v1 APIs through their existing token; the rejection
  // forces a Supabase refresh which re-reads role/membership state.
  try {
    await assertSessionNotRevoked(
      user.id,
      sessionData?.session?.access_token,
    );
  } catch (err) {
    if (err instanceof SessionRevokedError) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Session revoked — please sign in again' },
          { status: 401 },
        ),
      };
    }
    throw err;
  }

  // Audit 2026-05-26 — when we fall through to session-cookie auth,
  // mutating methods must pass an Origin / Referer check. Without it,
  // a cross-origin form submission from evil.com could trigger v1
  // POST/PATCH/DELETE routes (e.g. /api/v1/reports, /api/v1/webhooks)
  // via the user's session cookie. API-key requests skip this branch
  // because the bearer header isn't auto-attached cross-origin.
  if (!CSRF_SAFE_METHODS.has(request.method.toUpperCase())) {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) {
      return { ok: false, response: csrfError };
    }
  }

  const membership = await getSessionMembership(supabase, user.id);
  if (!membership?.orgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Organization context lost' },
        { status: 403 },
      ),
    };
  }

  if (!sessionHasScopes(membership.role, requiredScopes)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      ),
    };
  }

  if (options.requireAdmin && !isAdminRole(membership.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 },
      ),
    };
  }

  if (subscriptionRequired) {
    const blocked = await enforceActiveSubscription(membership.orgId);
    if (blocked) {
      return { ok: false, response: blocked };
    }
  }

  const identifier = user.id || getClientIp(request);
  const rateLimit = isLocalE2ERateLimitBypass(request)
    ? {
        success: true,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER,
        reset: Date.now() + 60_000,
      }
    : await getSessionRateLimit(identifier);
  if (!rateLimit.success) {
    const response = NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.reset },
      { status: 429 },
    );
    applyRateLimitHeaders(response, {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.reset,
    });
    return { ok: false, response };
  }

  return {
    ok: true,
    context: {
      accessType: 'session',
      orgId: membership.orgId,
      userId: user.id,
      role: membership.role,
      apiKeyId: null,
      grantedScopes: requiredScopes,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.reset,
      },
      supabase,
      db: supabase,
      request,
    },
  };
}

export function parsePagination(
  request: Request,
  options: { defaultLimit?: number; maxLimit?: number } = {},
) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get('limit') ?? options.defaultLimit ?? 25), 1),
    options.maxLimit ?? 100,
  );
  const cursorRaw = searchParams.get('cursor');
  const offset = decodeCursor(cursorRaw);
  return { limit, offset, cursor: cursorRaw, searchParams };
}

export function encodeCursor(offset: number): string | null {
  if (!Number.isFinite(offset) || offset < 0) return null;
  return Buffer.from(String(offset)).toString('base64url');
}

export function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const value = Number(decoded);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function createEnvelope<T>(
  data: T,
  meta: {
    total?: number;
    hasMore?: boolean;
    cursor?: string | null;
    [key: string]: unknown;
  } = {},
) {
  return {
    data,
    meta: {
      cursor: meta.cursor ?? null,
      hasMore: meta.hasMore ?? false,
      total: meta.total ?? (Array.isArray(data) ? data.length : 1),
      ...meta,
    },
  };
}

export function jsonWithContext(
  context: V1AuthContext,
  body: unknown,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);
  response.headers.set('X-RateLimit-Limit', String(context.rateLimit.limit));
  response.headers.set(
    'X-RateLimit-Remaining',
    String(Math.max(0, context.rateLimit.remaining)),
  );
  response.headers.set('X-RateLimit-Reset', String(context.rateLimit.resetAt));
  response.headers.set('X-FormaOS-Auth', context.accessType);
  return response;
}

export async function logV1Access(
  context: V1AuthContext,
  statusCode: number,
  scope?: ApiKeyScope | ApiKeyScope[] | null,
) {
  if (!context.apiKeyId) {
    return;
  }

  const scopeValue = Array.isArray(scope) ? scope.join(',') : scope ?? null;
  await logApiKeyUsage({
    apiKeyId: context.apiKeyId,
    orgId: context.orgId,
    scope: scopeValue,
    method: context.request.method,
    path: new URL(context.request.url).pathname,
    statusCode,
    ipAddress: getClientIp(context.request),
    userAgent: context.request.headers.get('user-agent'),
  });
}
