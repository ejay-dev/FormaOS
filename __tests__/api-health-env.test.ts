/** @jest-environment node */

import { GET } from '@/app/api/health/route';

function snapshotEnv(keys: string[]) {
  const prev: Record<string, string | undefined> = {};
  for (const key of keys) prev[key] = process.env[key];
  return prev;
}

function restoreEnv(prev: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('/api/health env hardening', () => {
  test('GET returns 200 (not 5xx) when Supabase env is missing', async () => {
    const keys = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_SERVICE_ROLE',
    ];
    const prev = snapshotEnv(keys);
    try {
      for (const key of keys) delete process.env[key];

      const res = await GET();
      expect(res.status).toBe(200);
    } finally {
      restoreEnv(prev);
    }
  });
});
