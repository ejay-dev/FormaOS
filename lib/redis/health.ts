import { getRedisClient, getRedisConfig } from '@/lib/redis/client';

let hasLoggedFailure = false;

export async function checkRedisHealth(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const { url, token } = getRedisConfig();
  if (!url || !token) {
    if (!hasLoggedFailure) {
      console.warn('[Redis] Missing Upstash Redis configuration.');
      hasLoggedFailure = true;
    }
    return { ok: false, reason: 'missing_config' };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      if (!hasLoggedFailure) {
        console.warn('[Redis] Redis client unavailable.');
        hasLoggedFailure = true;
      }
      return { ok: false, reason: 'client_unavailable' };
    }

    await redis.ping();
    return { ok: true };
  } catch (error) {
    if (!hasLoggedFailure) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[Redis] Health check failed:', message);
      hasLoggedFailure = true;
    }
    return { ok: false, reason: 'ping_failed' };
  }
}
