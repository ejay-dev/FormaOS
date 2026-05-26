import 'server-only';

import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { getRedisClient, getRedisConfig } from '@/lib/redis/client';
import { addRateLimitHeaders, checkApiRateLimit } from '@/lib/ratelimit';
import { logAuditEventCore } from '@/lib/audit/log-audit-event';
import type { ApiKey, ApiKeyUsageLog, ApiKeyValidationResult } from './types';
import {
  hasRequiredScopes,
  normalizeApiKeyScopes,
  type ApiKeyScope,
} from './scopes';

type ApiKeyRow = Record<string, any>;

const KEY_PREFIX = 'fos_';
const DEFAULT_RATE_LIMIT = 120;
const memoryRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function mapApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    org_id: row.org_id ?? row.organization_id,
    name: row.name,
    key_hash: row.key_hash,
    prefix: row.prefix,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    rate_limit: Number(row.rate_limit ?? DEFAULT_RATE_LIMIT),
    last_used: row.last_used ?? null,
    created_by: row.created_by ?? null,
    created_at: row.created_at,
    revoked_at: row.revoked_at ?? null,
  };
}

export function generateRawApiKey(): { key: string; prefix: string } {
  const prefix = `${KEY_PREFIX}${crypto.randomBytes(4).toString('hex')}`;
  const secret = crypto.randomBytes(24).toString('hex');
  return { key: `${prefix}.${secret}`, prefix };
}

export function hashApiKey(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function checkApiKeyRateLimit(
  apiKeyId: string,
  limit: number,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowMs = 60_000;
  const resetAt = now + windowMs;
  const key = `api-key:${apiKeyId}`;
  const { restUrl, token } = getRedisConfig();

  if (restUrl && token) {
    const redis = getRedisClient();
    if (redis) {
      const redisKey = `ratelimit:${key}`;
      try {
        const windowStart = now - windowMs;
        await redis.zremrangebyscore(redisKey, 0, windowStart);
        const count = await redis.zcount(redisKey, windowStart, now);

        if (count >= limit) {
          return { success: false, remaining: 0, resetAt };
        }

        await redis.zadd(redisKey, {
          score: now,
          // P0-10 (2026-05-26): use crypto.randomUUID instead of
          // Math.random — unique enough that two zadds in the same ms
          // never collide, no predictability surface.
          member: `${now}-${crypto.randomUUID()}`,
        });
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
        return {
          success: true,
          remaining: Math.max(0, limit - count - 1),
          resetAt,
        };
      } catch {
        // Fall through to in-memory limiter.
      }
    }
  }

  const current = memoryRateLimitStore.get(key);
  if (!current || current.resetAt < now) {
    memoryRateLimitStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (current.count >= limit) {
    return { success: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  memoryRateLimitStore.set(key, current);
  return {
    success: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

export async function createApiKey(args: {
  orgId: string;
  name: string;
  scopes: string[];
  rateLimit?: number;
  createdBy: string;
}): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  const supabase = createSupabaseOrgClient(args.orgId);
  const { key, prefix } = generateRawApiKey();
  const keyHash = hashApiKey(key);
  const scopes = normalizeApiKeyScopes(args.scopes);

  // org_id is stamped automatically by the org-scoped client.
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name: args.name,
      key_hash: keyHash,
      prefix,
      scopes,
      rate_limit: args.rateLimit ?? DEFAULT_RATE_LIMIT,
      created_by: args.createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create API key: ${error?.message ?? 'unknown error'}`);
  }

  // M2 (2026-05-26): migrated from lib/audit-trail (non-chained
  // activity_logs) to lib/audit/log-audit-event (hash-chained
  // org_audit_log via insertOrgAuditLog). API-key lifecycle events
  // are security-sensitive — they belong in the tamper-evident chain.
  await logAuditEventCore({
    organizationId: args.orgId,
    actorUserId: args.createdBy,
    actorRole: null,
    actionType: 'CREATE_API_KEY',
    entityType: 'api_key',
    entityId: data.id,
    afterState: { name: args.name, scopes, prefix },
  });

  return { apiKey: mapApiKey(data), plaintextKey: key };
}

export async function listApiKeys(orgId: string): Promise<ApiKey[]> {
  const supabase = createSupabaseOrgClient(orgId);
  // .eq('org_id', orgId) appended by the org-scoped client.
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return (data ?? []).map(mapApiKey);
}

export async function updateApiKey(
  keyId: string,
  orgId: string,
  updates: { name?: string; scopes?: string[]; rateLimit?: number },
): Promise<ApiKey> {
  const supabase = createSupabaseOrgClient(orgId);
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.scopes !== undefined) {
    payload.scopes = normalizeApiKeyScopes(updates.scopes);
  }
  if (updates.rateLimit !== undefined) payload.rate_limit = updates.rateLimit;

  // .eq('org_id', orgId) appended by the org-scoped client.
  const { data, error } = await supabase
    .from('api_keys')
    .update(payload)
    .eq('id', keyId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update API key: ${error?.message ?? 'not found'}`);
  }

  return mapApiKey(data);
}

export async function revokeApiKey(args: {
  keyId: string;
  orgId: string;
  revokedBy?: string;
}): Promise<void> {
  const supabase = createSupabaseOrgClient(args.orgId);
  // .eq('org_id', args.orgId) appended by the org-scoped client.
  const { error } = await supabase
    .from('api_keys')
    .update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.keyId);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  if (args.revokedBy) {
    await logAuditEventCore({
      organizationId: args.orgId,
      actorUserId: args.revokedBy,
      actorRole: null,
      actionType: 'REVOKE_API_KEY',
      entityType: 'api_key',
      entityId: args.keyId,
    });
  }
}

export async function rotateApiKey(args: {
  keyId: string;
  orgId: string;
  rotatedBy: string;
  scopes?: string[];
  rateLimit?: number;
  name?: string;
}): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  const supabase = createSupabaseOrgClient(args.orgId);
  const { key, prefix } = generateRawApiKey();
  const keyHash = hashApiKey(key);
  const payload: Record<string, unknown> = {
    key_hash: keyHash,
    prefix,
    revoked_at: null,
    last_used: null,
    updated_at: new Date().toISOString(),
  };

  if (args.scopes) payload.scopes = normalizeApiKeyScopes(args.scopes);
  if (args.rateLimit !== undefined) payload.rate_limit = args.rateLimit;
  if (args.name !== undefined) payload.name = args.name;

  // .eq('org_id', args.orgId) appended by the org-scoped client.
  const { data, error } = await supabase
    .from('api_keys')
    .update(payload)
    .eq('id', args.keyId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to rotate API key: ${error?.message ?? 'not found'}`);
  }

  await logAuditEventCore({
    organizationId: args.orgId,
    actorUserId: args.rotatedBy,
    actorRole: null,
    actionType: 'ROTATE_API_KEY',
    entityType: 'api_key',
    entityId: args.keyId,
    afterState: { prefix },
  });

  return { apiKey: mapApiKey(data), plaintextKey: key };
}

export async function validateApiKey(
  rawKey: string,
  requiredScopes: ApiKeyScope[] = [],
): Promise<ApiKeyValidationResult> {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return { ok: false, error: 'Invalid API key format', status: 401 };
  }

  // Intentional admin client: this function discovers the org from the
  // key (via key_hash lookup) — the caller does not know which org the
  // key belongs to. createSupabaseOrgClient cannot be used until after
  // the key row has been fetched, so the initial lookup, the
  // org_members role check, the soft-revoke on demotion, and the
  // last_used touch all stay on the admin client. The post-lookup
  // operations are then naturally scoped by `apiKey.id` / `apiKey.org_id`
  // filters from the just-read row.
  const admin = createSupabaseAdminClient();
  const keyHash = hashApiKey(rawKey);
  const { data, error } = await admin
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Invalid API key', status: 401 };
  }

  const apiKey = mapApiKey(data);

  // High-14: defense-in-depth role check. The org_members triggers added
  // in 20260623_003_api_key_owner_check.sql revoke a key when its
  // creator is demoted or removed, but a runtime check here closes the
  // window between the role change and the trigger committing (and
  // protects against any path that mutates org_members outside of
  // PostgreSQL — direct DB access, dump-restore, etc.). If the key has
  // no recorded creator (legacy/system keys) the role gate is skipped.
  if (apiKey.created_by) {
    const { data: membership } = await admin
      .from('org_members')
      .select('role')
      .eq('organization_id', apiKey.org_id)
      .eq('user_id', apiKey.created_by)
      .maybeSingle<{ role: string }>();
    const stillAdmin =
      membership?.role === 'owner' || membership?.role === 'admin';
    if (!stillAdmin) {
      // Soft-revoke so subsequent calls hit the key_hash filter and
      // short-circuit before reaching this check.
      await admin
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', apiKey.id)
        .is('revoked_at', null);
      return {
        ok: false,
        apiKey,
        error: 'API key revoked: creator no longer admin',
        status: 401,
      };
    }
  }

  if (!hasRequiredScopes(apiKey.scopes, requiredScopes)) {
    return { ok: false, apiKey, error: 'Missing required API key scope', status: 403 };
  }

  const rateLimit = await checkApiKeyRateLimit(apiKey.id, apiKey.rate_limit || DEFAULT_RATE_LIMIT);
  if (!rateLimit.success) {
    return {
      ok: false,
      apiKey,
      error: 'API key rate limit exceeded',
      status: 429,
      remaining: 0,
      resetAt: rateLimit.resetAt,
    };
  }

  // v4-027: previously wrote api_keys.last_used on every single
  // validation — a chatty key (cron + dashboard polling) hit the
  // table dozens of times per minute, dominating Supabase write IO.
  // Throttle to once per minute per key: only update when the
  // current last_used is older than 60 seconds. Concurrency-safe
  // via the WHERE clause — no read-modify-write race.
  const minutelyThreshold = new Date(Date.now() - 60 * 1000).toISOString();
  await admin
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('id', apiKey.id)
    .or(`last_used.is.null,last_used.lt.${minutelyThreshold}`);

  return {
    ok: true,
    apiKey,
    remaining: rateLimit.remaining,
    resetAt: rateLimit.resetAt,
  };
}

export async function logApiKeyUsage(args: {
  apiKeyId: string;
  orgId: string;
  scope?: string | null;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ApiKeyUsageLog | null> {
  const supabase = createSupabaseOrgClient(args.orgId);
  // org_id is stamped automatically by the org-scoped client.
  const { data, error } = await supabase
    .from('api_key_usage_log')
    .insert({
      api_key_id: args.apiKeyId,
      scope: args.scope ?? null,
      method: args.method,
      path: args.path,
      status_code: args.statusCode,
      ip_address: args.ipAddress ?? null,
      user_agent: args.userAgent ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    return null;
  }

  return data as ApiKeyUsageLog;
}

export async function getSessionRateLimit(identifier: string) {
  return checkApiRateLimit(identifier);
}

export function applyRateLimitHeaders(
  response: Response,
  args: { limit: number; remaining: number; resetAt: number },
): Response {
  return addRateLimitHeaders(response, {
    success: true,
    limit: args.limit,
    remaining: args.remaining,
    reset: args.resetAt,
  });
}

