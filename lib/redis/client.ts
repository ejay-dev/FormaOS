import { Redis } from '@upstash/redis';
import { consoleShim } from '@/lib/monitoring/console-shim';

type RedisConfig = {
  restUrl: string | null;
  token: string | null;
  tcpUrl: string | null;
};

let cachedClient: Redis | null = null;
let cachedConfig: RedisConfig | null = null;
let hasWarnedAboutProtocol = false;
let hasWarnedAboutMissingProductionRedis = false;

function isRedisRequiredRuntime() {
  return (
    process.env.REDIS_REQUIRED === 'true' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production'
  );
}

function normalizeRestUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeTcpUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

export function getRedisConfig(): RedisConfig {
  if (cachedConfig) return cachedConfig;

  const restUrl = normalizeRestUrl(
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  );
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    null;
  const tcpUrl = normalizeTcpUrl(
    process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL,
  );

  cachedConfig = { restUrl, token, tcpUrl };
  return cachedConfig;
}

export function getRedisClient(): Redis | null {
  if (cachedClient) return cachedClient;
  const { restUrl, token, tcpUrl } = getRedisConfig();

  if (!restUrl || !token) {
    if (!restUrl && tcpUrl && !hasWarnedAboutProtocol) {
      consoleShim.warn(
        '[Redis] TCP URL detected without REST credentials. Upstash REST features remain disabled.',
      );
      hasWarnedAboutProtocol = true;
    }
    if (isRedisRequiredRuntime() && !hasWarnedAboutMissingProductionRedis) {
      consoleShim.error(
        '[Redis] Upstash REST credentials are missing in a Redis-required runtime. Auth/admin rate limits fail closed; non-critical API paths use degraded in-memory limits.',
      );
      hasWarnedAboutMissingProductionRedis = true;
    }
    return null;
  }

  cachedClient = new Redis({ url: restUrl, token });
  return cachedClient;
}
