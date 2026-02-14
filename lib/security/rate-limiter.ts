/**
 * FormaOS Security Module - Rate Limiter
 *
 * Provides rate limiting for auth and API routes using Upstash Redis
 * with graceful fallback to in-memory storage.
 * Protects from brute force attacks.
 *
 * Redis is preferred because it persists across deployments and
 * is shared across all serverless function instances. If Redis is
 * unavailable (no credentials or network error), the in-memory Map
 * is used as a degraded but functional fallback.
 */

import { headers } from 'next/headers';
import {
  logRateLimitEvent,
  logRateLimitFailOpenWarning,
} from '@/lib/security/rate-limit-log';
import { extractClientIP } from '@/lib/security/session-security';
import { getRedisClient } from '@/lib/redis/client';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

type RedisCheckOutcome = {
  result: RateLimitResult | null;
  failOpenReason?: 'redis_unavailable' | 'redis_error';
};

const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl:auth',
  } as RateLimitConfig,

  API: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'rl:api',
  } as RateLimitConfig,

  GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    keyPrefix: 'rl:gen',
  } as RateLimitConfig,

  UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'rl:upload',
  } as RateLimitConfig,
  EXPORT: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'rl:export',
  } as RateLimitConfig,

  HEARTBEAT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Event-driven heartbeats can cluster on focus/navigation
    keyPrefix: 'rl:heartbeat',
  } as RateLimitConfig,

  ACTIVITY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Allow 20 activity logs per minute
    keyPrefix: 'rl:activity',
  } as RateLimitConfig,
} as const;

// ---------------------------------------------------------------------------
// In-memory fallback store (used when Redis is unavailable)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, { count: number; resetAt: number }>();
const failOpenWarningAtByScope = new Map<string, number>();
const FAIL_OPEN_WARNING_COOLDOWN_MS = 60 * 1000;

function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function buildKey(
  config: RateLimitConfig,
  identifier: string,
  userId?: string | null,
): string {
  return userId
    ? `${config.keyPrefix}:user:${userId}`
    : `${config.keyPrefix}:ip:${identifier}`;
}

// ---------------------------------------------------------------------------
// Redis-backed rate limiting
// ---------------------------------------------------------------------------

/**
 * Attempt rate-limit check via Redis using atomic INCR + EXPIRE.
 * Returns null if Redis is unavailable so the caller can fall back.
 */
async function checkRateLimitRedis(
  config: RateLimitConfig,
  key: string,
): Promise<RedisCheckOutcome> {
  const redis = getRedisClient();
  if (!redis) {
    return { result: null, failOpenReason: 'redis_unavailable' };
  }

  try {
    const ttlSeconds = Math.ceil(config.windowMs / 1000);

    // Atomically increment the counter
    const count = await redis.incr(key);

    // If this is the first request in the window, set the TTL
    if (count === 1) {
      await redis.expire(key, ttlSeconds);
    }

    // Retrieve the actual TTL so we can compute resetAt accurately.
    // If EXPIRE failed or the key has no TTL, fall back to the full window.
    const currentTtl = await redis.ttl(key);
    const effectiveTtl = currentTtl > 0 ? currentTtl : ttlSeconds;
    const resetAt = Date.now() + effectiveTtl * 1000;

    if (count > config.maxRequests) {
      return {
        result: {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetAt,
          retryAfter: effectiveTtl,
        },
      };
    }

    return {
      result: {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - count,
        resetAt,
      },
    };
  } catch {
    // Redis error -- signal fallback
    return { result: null, failOpenReason: 'redis_error' };
  }
}

/**
 * Read the current rate-limit status from Redis without incrementing.
 * Returns null if Redis is unavailable.
 */
async function getRateLimitStatusRedis(
  config: RateLimitConfig,
  key: string,
): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const ttlSeconds = Math.ceil(config.windowMs / 1000);

    const [countRaw, currentTtl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key),
    ]);

    const count = countRaw ?? 0;
    const effectiveTtl = currentTtl > 0 ? currentTtl : ttlSeconds;
    const resetAt = Date.now() + effectiveTtl * 1000;
    const remaining = Math.max(0, config.maxRequests - count);

    return {
      success: count < config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetAt,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-memory rate limiting (fallback)
// ---------------------------------------------------------------------------

function checkRateLimitMemory(
  config: RateLimitConfig,
  key: string,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  // Probabilistic cleanup to avoid unbounded growth
  if (Math.random() < 0.05) {
    cleanExpiredEntries();
  }

  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = existing.resetAt - now;
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil(retryAfter / 1000),
    };
  }

  existing.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

function getRateLimitStatusMemory(
  config: RateLimitConfig,
  key: string,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - existing.count);
  return {
    success: existing.count < config.maxRequests,
    limit: config.maxRequests,
    remaining,
    resetAt: existing.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Client identifier helpers
// ---------------------------------------------------------------------------

export async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    if (realIp) {
      return realIp.trim();
    }
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }

    return 'unknown';
  } catch {
    return 'server';
  }
}

export async function getUserIdentifier(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-user-id');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API  (unchanged signatures)
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
  userId?: string | null,
): Promise<RateLimitResult> {
  const key = buildKey(config, identifier, userId);

  // Try Redis first
  const redisOutcome = await checkRateLimitRedis(config, key);
  if (redisOutcome.result !== null) {
    return redisOutcome.result;
  }

  if (redisOutcome.failOpenReason) {
    const scope = `${config.keyPrefix}:${redisOutcome.failOpenReason}`;
    const now = Date.now();
    const lastWarningAt = failOpenWarningAtByScope.get(scope) ?? 0;

    if (now - lastWarningAt > FAIL_OPEN_WARNING_COOLDOWN_MS) {
      failOpenWarningAtByScope.set(scope, now);
      void logRateLimitFailOpenWarning({
        reason: redisOutcome.failOpenReason,
        keyPrefix: config.keyPrefix,
        identifier,
        userId,
      });
    }
  }

  // Fall back to in-memory
  return checkRateLimitMemory(config, key);
}

export function createRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

export async function rateLimitAuth(request: Request): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
}> {
  const identifier = await getClientIdentifier();
  const result = await checkRateLimit(RATE_LIMITS.AUTH, identifier);
  const headers = createRateLimitHeaders(result);

  if (!result.success) {
    const endpoint = new URL(request.url).pathname;
    const ipAddress = extractClientIP(request.headers);
    const userAgent = request.headers.get('user-agent');
    void logRateLimitEvent({
      identifier,
      endpoint,
      requestCount: RATE_LIMITS.AUTH.maxRequests,
      windowStart: result.resetAt - RATE_LIMITS.AUTH.windowMs,
      blocked: true,
      ipAddress,
      userAgent,
    });
  }

  return { allowed: result.success, headers };
}

export async function rateLimitApi(
  request: Request,
  userId?: string | null,
): Promise<RateLimitResult> {
  const identifier = await getClientIdentifier();
  const result = await checkRateLimit(RATE_LIMITS.API, identifier, userId);

  if (!result.success) {
    const endpoint = new URL(request.url).pathname;
    const ipAddress = extractClientIP(request.headers);
    const userAgent = request.headers.get('user-agent');
    void logRateLimitEvent({
      identifier: userId ?? identifier,
      endpoint,
      requestCount: RATE_LIMITS.API.maxRequests,
      windowStart: result.resetAt - RATE_LIMITS.API.windowMs,
      blocked: true,
      userId: userId ?? undefined,
      ipAddress,
      userAgent,
    });
  }

  return result;
}

export function createRateLimitedResponse(
  message: string,
  status: number = 429,
  headers?: Record<string, string>,
): Response {
  const body = JSON.stringify({ error: message, code: 'RATE_LIMIT_EXCEEDED' });

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  });
}

export async function getRateLimitStatus(
  config: RateLimitConfig,
  identifier: string,
  userId?: string | null,
): Promise<RateLimitResult> {
  const key = buildKey(config, identifier, userId);

  // Try Redis first
  const redisResult = await getRateLimitStatusRedis(config, key);
  if (redisResult !== null) {
    return redisResult;
  }

  // Fall back to in-memory
  return getRateLimitStatusMemory(config, key);
}

export type { RateLimitConfig, RateLimitResult };
export { RATE_LIMITS };
