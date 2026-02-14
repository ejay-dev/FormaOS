/**
 * =========================================================
 * RATE LIMITING UTILITY
 * =========================================================
 *
 * Uses Upstash Redis for distributed rate limiting.
 *
 * Rate limits:
 * - Auth endpoints (signin, signup): 10 requests per 10 minutes per IP
 * - API endpoints: 60 requests per minute per user
 * - Public forms: 5 requests per 10 minutes per IP
 *
 * Usage:
 * ```ts
 * import { checkAuthRateLimit } from '@/lib/ratelimit';
 *
 * const { success, limit, remaining, reset } = await checkAuthRateLimit(ip);
 * if (!success) {
 *   return Response.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */

import { getRedisClient, getRedisConfig } from '@/lib/redis/client';

// Simple rate limiter implementation
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const FAIL_OPEN_WARNING_COOLDOWN_MS = 5 * 60 * 1000;
const failOpenWarningTimestamps = new Map<string, number>();

function logFailOpenWarning(
  reason: string,
  metadata: Record<string, unknown> = {}
): void {
  const now = Date.now();
  const lastLogAt = failOpenWarningTimestamps.get(reason) ?? 0;
  if (now - lastLogAt < FAIL_OPEN_WARNING_COOLDOWN_MS) {
    return;
  }

  failOpenWarningTimestamps.set(reason, now);
  console.warn('[RateLimit][FailOpen]', {
    reason,
    metadata,
    timestamp: new Date(now).toISOString(),
  });
}

/**
 * Generic rate limiter using sliding window
 */
async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // If Redis not configured, allow all requests (dev mode)
  const { url, token } = getRedisConfig();
  if (!url || !token) {
    logFailOpenWarning('redis_not_configured', { key, limit, windowMs });
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowMs,
    };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      logFailOpenWarning('redis_client_unavailable', { key, limit, windowMs });
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowMs,
      };
    }
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;

    // Remove old entries outside the window
    await redis.zremrangebyscore(redisKey, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcount(redisKey, windowStart, now);

    if (count >= limit) {
      // Get the oldest request timestamp to calculate reset time
      const oldestRequests = await redis.zrange(redisKey, 0, 0, {
        withScores: true,
      });
      const oldestScore =
        Array.isArray(oldestRequests) &&
        oldestRequests.length > 0 &&
        typeof (oldestRequests[0] as { score?: unknown }).score === 'number'
          ? (oldestRequests[0] as { score: number }).score
          : now;
      const oldestTimestamp = Number(oldestScore);
      const reset = oldestTimestamp + windowMs;

      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    // Add current request
    await redis.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });

    // Set expiry on the key
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));

    return {
      success: true,
      limit,
      remaining: limit - count - 1,
      reset: now + windowMs,
    };
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    logFailOpenWarning('redis_rate_limit_error', {
      key,
      limit,
      windowMs,
      error: error instanceof Error ? error.message : String(error),
    });
    // On error, allow the request (fail open)
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowMs,
    };
  }
}

/**
 * Rate limit for authentication endpoints (signin, signup)
 * 10 requests per 10 minutes per IP
 */
export async function checkAuthRateLimit(
  ip: string
): Promise<RateLimitResult> {
  return rateLimit(`auth:${ip}`, 10, 10 * 60 * 1000); // 10 req / 10 min
}

/**
 * Rate limit for API endpoints
 * 60 requests per minute per user/IP
 */
export async function checkApiRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  return rateLimit(`api:${identifier}`, 60, 60 * 1000); // 60 req / min
}

/**
 * Rate limit for public forms (contact, leads)
 * 5 requests per 10 minutes per IP
 */
export async function checkFormRateLimit(
  ip: string
): Promise<RateLimitResult> {
  return rateLimit(`form:${ip}`, 5, 10 * 60 * 1000); // 5 req / 10 min
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Try common headers in order of reliability
  const headers = request.headers;

  // Vercel-specific header
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Generic
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}
