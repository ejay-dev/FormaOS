import 'server-only';

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/ratelimit';
import { normalizeApiKeyScopes, type ApiKeyScope } from './scopes';
import {
  applyRateLimitHeaders,
  getSessionRateLimit,
  logApiKeyUsage,
  validateApiKey,
} from './manager';

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
  const modern = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!modern.error && modern.data?.organization_id) {
    return {
      orgId: modern.data.organization_id as string,
      role: (modern.data.role as string | null) ?? null,
    };
  }

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
  } = {},
): Promise<
  | { ok: true; context: V1AuthContext }
  | { ok: false; response: NextResponse }
> {
  const requiredScopes = normalizeApiKeyScopes(options.requiredScopes ?? []);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      ),
    };
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

  const identifier = user.id || getClientIp(request);
  const rateLimit = await getSessionRateLimit(identifier);
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
