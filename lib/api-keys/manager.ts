import 'server-only';

import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getRedisClient, getRedisConfig } from '@/lib/redis/client';
import { addRateLimitHeaders, checkApiRateLimit } from '@/lib/ratelimit';
import { logActivity } from '@/lib/audit-trail';
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

        await redis.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
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
  const admin = createSupabaseAdminClient();
  const { key, prefix } = generateRawApiKey();
  const keyHash = hashApiKey(key);
  const scopes = normalizeApiKeyScopes(args.scopes);

  const { data, error } = await admin
    .from('api_keys')
    .insert({
      org_id: args.orgId,
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

  await logActivity(args.orgId, args.createdBy, 'create', 'auth', {
    entityId: data.id,
    entityName: args.name,
    details: { type: 'api_key', scopes, prefix },
  });

  return { apiKey: mapApiKey(data), plaintextKey: key };
}

export async function listApiKeys(orgId: string): Promise<ApiKey[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('api_keys')
    .select('*')
    .eq('org_id', orgId)
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
  const admin = createSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.scopes !== undefined) {
    payload.scopes = normalizeApiKeyScopes(updates.scopes);
  }
  if (updates.rateLimit !== undefined) payload.rate_limit = updates.rateLimit;

  const { data, error } = await admin
    .from('api_keys')
    .update(payload)
    .eq('id', keyId)
    .eq('org_id', orgId)
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
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('api_keys')
    .update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.keyId)
    .eq('org_id', args.orgId);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  if (args.revokedBy) {
    await logActivity(args.orgId, args.revokedBy, 'delete', 'auth', {
      entityId: args.keyId,
      details: { type: 'api_key' },
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
  const admin = createSupabaseAdminClient();
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

  const { data, error } = await admin
    .from('api_keys')
    .update(payload)
    .eq('id', args.keyId)
    .eq('org_id', args.orgId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to rotate API key: ${error?.message ?? 'not found'}`);
  }

  await logActivity(args.orgId, args.rotatedBy, 'update', 'auth', {
    entityId: args.keyId,
    details: { type: 'api_key_rotation', prefix },
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

  await admin
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('id', apiKey.id);

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
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('api_key_usage_log')
    .insert({
      api_key_id: args.apiKeyId,
      org_id: args.orgId,
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

