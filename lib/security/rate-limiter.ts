/**
 * FormaOS Security Module - Rate Limiter
 * 
 * Provides in-memory rate limiting for auth and API routes.
 * Protects from brute force attacks.
 */

import { headers } from "next/headers";

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

const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: "rl:auth",
  } as RateLimitConfig,
  
  API: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: "rl:api",
  } as RateLimitConfig,
  
  GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    keyPrefix: "rl:gen",
  } as RateLimitConfig,
  
  UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: "rl:upload",
  } as RateLimitConfig,
  EXPORT: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: "rl:export",
  } as RateLimitConfig,
} as const;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    if (realIp) {
      return realIp.trim();
    }
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
    
    return "unknown";
  } catch {
    return "server";
  }
}

export async function getUserIdentifier(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-user-id");
  } catch {
    return null;
  }
}

function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
  userId?: string | null
): Promise<RateLimitResult> {
  const key = userId 
    ? `${config.keyPrefix}:user:${userId}`
    : `${config.keyPrefix}:ip:${identifier}`;
  
  const now = Date.now();
  const existing = memoryStore.get(key);
  
  if (Math.random() < 0.05) {
    cleanExpiredEntries();
  }
  
  if (!existing) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  if (now > existing.resetAt) {
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

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter && { "Retry-After": result.retryAfter.toString() }),
  };
}

export async function rateLimitAuth(request: Request): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
}> {
  const identifier = await getClientIdentifier();
  const result = await checkRateLimit(RATE_LIMITS.AUTH, identifier);
  const headers = createRateLimitHeaders(result);
  
  return { allowed: result.success, headers };
}

export async function rateLimitApi(
  request: Request,
  userId?: string | null
): Promise<RateLimitResult> {
  const identifier = await getClientIdentifier();
  return checkRateLimit(RATE_LIMITS.API, identifier, userId);
}
  const identifier = await getClientIdentifier();
  const result = await checkRateLimit(RATE_LIMITS.API, identifier, userId);
  const headers = createRateLimitHeaders(result);
  
  return { allowed: result.success, headers };
}

export function createRateLimitedResponse(
  message: string,
  status: number = 429,
  headers?: Record<string, string>
): Response {
  const body = JSON.stringify({ error: message, code: "RATE_LIMIT_EXCEEDED" });
  
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...headers,
    },
  });
}

export async function getRateLimitStatus(
  config: RateLimitConfig,
  identifier: string,
  userId?: string | null
): Promise<RateLimitResult> {
  const key = userId 
    ? `${config.keyPrefix}:user:${userId}`
    : `${config.keyPrefix}:ip:${identifier}`;
  
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

export type { RateLimitConfig, RateLimitResult };
export { RATE_LIMITS };
