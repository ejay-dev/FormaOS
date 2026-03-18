export function setupTestEnv(overrides: Record<string, string> = {}) {
  const previous: Record<string, string | undefined> = {};
  const defaults: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://formaos.test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test-key',
    STRIPE_SECRET_KEY: 'sk_test_123',
    UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  };

  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }

  return {
    restore() {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}

