import { getRedisClient, getRedisConfig } from '@/lib/redis/client';

let hasLoggedFailure = false;

export async function checkRedisHealth(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const { restUrl, token, tcpUrl } = getRedisConfig();
  if (!restUrl || !token) {
    if (!hasLoggedFailure) {
      const reason = tcpUrl
        ? 'Missing Upstash REST configuration.'
        : 'Missing Upstash Redis configuration.';
      console.warn(`[Redis] ${reason}`);
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
