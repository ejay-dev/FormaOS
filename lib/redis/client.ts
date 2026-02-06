import { Redis } from '@upstash/redis';

type RedisConfig = {
  url: string | null;
  token: string | null;
};

let cachedClient: Redis | null = null;
let cachedConfig: RedisConfig | null = null;

export function getRedisConfig(): RedisConfig {
  if (cachedConfig) return cachedConfig;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.UPSTASH_REDIS_URL ??
    null;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.UPSTASH_REDIS_TOKEN ??
    null;

  cachedConfig = { url, token };
  return cachedConfig;
}

export function getRedisClient(): Redis | null {
  if (cachedClient) return cachedClient;
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    return null;
  }

  cachedClient = new Redis({ url, token });
  return cachedClient;
}
