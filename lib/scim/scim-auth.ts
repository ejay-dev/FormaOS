import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/rate-limiter';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import { SCIM_SCHEMA_ERROR } from '@/lib/scim/scim-schemas';

const DEFAULT_SCIM_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 120,
  keyPrefix: 'rl:scim',
  failClosed: true,
} as const;

export interface ScimAuthContext {
  orgId: string;
  tokenId: string;
  tokenLabel: string | null;
  tokenPrefix: string | null;
  headers: Record<string, string>;
}

export interface ScimErrorBody {
  schemas: string[];
  status: string;
  scimType?: string;
  detail: string;
}

export function scimError(
  status: number,
  detail: string,
  scimType?: string,
): ScimErrorBody {
  return {
    schemas: [SCIM_SCHEMA_ERROR],
    status: String(status),
    ...(scimType ? { scimType } : {}),
    detail,
  };
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

function compareHash(token: string, storedHash: string) {
  const incoming = Buffer.from(sha256(token), 'utf8');
  const existing = Buffer.from(storedHash, 'utf8');

  if (incoming.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(incoming, existing);
}

export async function authenticateScimRequest(
  request: Request,
  orgId: string,
): Promise<
  | { ok: true; context: ScimAuthContext }
  | { ok: false; status: number; error: ScimErrorBody; headers?: Record<string, string> }
> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: scimError(401, 'Bearer token required'),
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('scim_tokens')
    .select(
      'id, organization_id, token_hash, label, token_prefix, active, max_requests_per_minute',
    )
    .eq('organization_id', orgId)
    .eq('active', true)
    .limit(10);

  if (error || !data?.length) {
    return {
      ok: false,
      status: 401,
      error: scimError(401, 'SCIM is not configured for this organization'),
    };
  }

  const tokenRow = data.find((row: any) => compareHash(token, row.token_hash));
  if (!tokenRow) {
    return {
      ok: false,
      status: 401,
      error: scimError(401, 'Invalid bearer token'),
    };
  }

  const identifier = await getClientIdentifier();
  const rateLimitResult = await checkRateLimit(
    {
      ...DEFAULT_SCIM_RATE_LIMIT,
      maxRequests: Math.max(10, tokenRow.max_requests_per_minute ?? 120),
      keyPrefix: `rl:scim:${tokenRow.id}`,
    },
    identifier,
  );
  const headers = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return {
      ok: false,
      status: 429,
      headers,
      error: scimError(429, 'SCIM rate limit exceeded'),
    };
  }

  await admin
    .from('scim_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id);

  return {
    ok: true,
    context: {
      orgId,
      tokenId: tokenRow.id,
      tokenLabel: tokenRow.label ?? null,
      tokenPrefix: tokenRow.token_prefix ?? null,
      headers,
    },
  };
}

export async function generateScimToken(args: {
  orgId: string;
  createdBy?: string | null;
  label?: string | null;
  maxRequestsPerMinute?: number | null;
}) {
  const admin = createSupabaseAdminClient();
  const rawToken = randomBytes(24).toString('hex');
  const tokenPrefix = rawToken.slice(0, 8);
  const tokenHash = sha256(rawToken);

  const { data, error } = await admin
    .from('scim_tokens')
    .insert({
      organization_id: args.orgId,
      token_hash: tokenHash,
      label: args.label ?? 'SCIM token',
      created_by: args.createdBy ?? null,
      token_prefix: tokenPrefix,
      max_requests_per_minute: args.maxRequestsPerMinute ?? 120,
      active: true,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logIdentityEvent({
    eventType: 'auth.api_key.created',
    actorType: args.createdBy ? 'user' : 'system',
    actorId: args.createdBy ?? null,
    actorLabel: args.label ?? 'SCIM token',
    orgId: args.orgId,
    result: 'success',
    metadata: {
      token_id: data.id,
      token_prefix: tokenPrefix,
      purpose: 'scim',
    },
  });

  return {
    tokenId: data.id as string,
    token: rawToken,
    tokenPrefix,
  };
}

export async function rotateScimToken(args: {
  orgId: string;
  tokenId: string;
  actorId?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const rawToken = randomBytes(24).toString('hex');
  const tokenPrefix = rawToken.slice(0, 8);

  const { error } = await admin
    .from('scim_tokens')
    .update({
      token_hash: sha256(rawToken),
      token_prefix: tokenPrefix,
      rotated_at: new Date().toISOString(),
      active: true,
    })
    .eq('id', args.tokenId)
    .eq('organization_id', args.orgId);

  if (error) {
    throw new Error(error.message);
  }

  await logIdentityEvent({
    eventType: 'auth.api_key.revoked',
    actorType: args.actorId ? 'user' : 'system',
    actorId: args.actorId ?? null,
    orgId: args.orgId,
    result: 'success',
    metadata: {
      token_id: args.tokenId,
      replacement_token_prefix: tokenPrefix,
      purpose: 'scim_rotation',
    },
  });

  return {
    token: rawToken,
    tokenPrefix,
  };
}

export async function auditScimOperation(args: {
  orgId: string;
  tokenLabel?: string | null;
  eventType:
    | 'scim.user.create'
    | 'scim.user.update'
    | 'scim.user.delete'
    | 'scim.group.create'
    | 'scim.group.update'
    | 'scim.group.delete'
    | 'scim.bulk';
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  await logIdentityEvent({
    eventType: args.eventType,
    actorType: 'scim_client',
    actorLabel: args.tokenLabel ?? 'SCIM client',
    orgId: args.orgId,
    targetUserId: args.targetUserId ?? null,
    targetUserEmail: args.targetUserEmail ?? null,
    ipAddress:
      args.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      args.request?.headers.get('x-real-ip') ??
      null,
    userAgent: args.request?.headers.get('user-agent') ?? null,
    result: args.result,
    metadata: args.metadata,
  });
}
