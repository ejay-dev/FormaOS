/**
 * Intelligence API Cache & Rate Limiting
 * Prevents Supabase query spikes from intelligence panel
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  orgId: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory cache (fallback if Upstash unavailable)
const cache = new Map<string, CacheEntry>();
const rateLimits = new Map<string, RateLimitEntry>();

// Cache TTL: 60 seconds
const CACHE_TTL = 60 * 1000;

// Rate limit: 10 requests per minute per org
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

/**
 * Get cached intelligence data
 */
export function getCachedIntelligence(orgId: string): any | null {
  const key = `intelligence:${orgId}`;
  const entry = cache.get(key);

  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cached intelligence data
 */
export function setCachedIntelligence(orgId: string, data: any): void {
  const key = `intelligence:${orgId}`;
  cache.set(key, {
    data,
    timestamp: Date.now(),
    orgId,
  });

  // Cleanup old entries (prevent memory leak)
  if (cache.size > 1000) {
    const entries = Array.from(cache.entries());
    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 100 entries
    sorted.slice(0, 100).forEach(([key]) => cache.delete(key));
  }
}

/**
 * Check rate limit for organization
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(orgId: string): boolean {
  const key = `ratelimit:${orgId}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimits.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  // Increment count
  entry.count += 1;
  rateLimits.set(key, entry);
  return true;
}

/**
 * Get rate limit status for organization
 */
export function getRateLimitStatus(orgId: string): {
  remaining: number;
  resetAt: number;
} {
  const key = `ratelimit:${orgId}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    return {
      remaining: RATE_LIMIT_MAX,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  return {
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Clear cache for organization (admin use)
 */
export function clearIntelligenceCache(orgId?: string): void {
  if (orgId) {
    const key = `intelligence:${orgId}`;
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Clear rate limits for organization (admin use)
 */
export function clearRateLimit(orgId?: string): void {
  if (orgId) {
    const key = `ratelimit:${orgId}`;
    rateLimits.delete(key);
  } else {
    rateLimits.clear();
  }
}
