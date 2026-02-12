import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getRedisClient } from '@/lib/redis/client';

export type PublicUptimeRow = {
  checked_at: string;
  ok: boolean;
  latency_ms: number | null;
  source: string;
};

type InsertPayload = {
  ok: boolean;
  latency_ms: number | null;
  source: string;
  details?: Record<string, unknown>;
};

const REDIS_KEY = 'status:public_uptime_checks:v1';
const REDIS_MAX = 6000;

function isMissingTableError(err: unknown): boolean {
  const e = err as any;
  const code = String(e?.code ?? '');
  const msg = String(e?.message ?? '');
  return (
    code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

export async function appendPublicUptimeCheck(
  payload: InsertPayload,
): Promise<{ ok: boolean; stored: 'db' | 'redis' | 'none'; error?: string }> {
  const admin = createSupabaseAdminClient();

  // 1) Prefer DB if the table exists in this environment.
  try {
    const insert = await admin.from('public_uptime_checks').insert({
      ok: payload.ok,
      latency_ms: payload.latency_ms,
      source: payload.source,
      details: payload.details ?? {},
    });

    if (!insert.error) {
      return { ok: true, stored: 'db' };
    }

    if (!isMissingTableError(insert.error)) {
      return { ok: false, stored: 'none', error: insert.error.message };
    }
  } catch (err) {
    if (!isMissingTableError(err)) {
      return {
        ok: false,
        stored: 'none',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 2) Fallback to Redis (keeps status page useful even when DB migrations lag).
  try {
    const redis = getRedisClient();
    if (!redis) {
      return {
        ok: false,
        stored: 'none',
        error: 'Redis not configured and uptime table unavailable',
      };
    }

    const row: PublicUptimeRow = {
      checked_at: new Date().toISOString(),
      ok: payload.ok,
      latency_ms: payload.latency_ms,
      source: payload.source,
    };

    // Store newest first; keep bounded list.
    await redis.lpush(REDIS_KEY, JSON.stringify(row));
    await redis.ltrim(REDIS_KEY, 0, REDIS_MAX - 1);
    return { ok: true, stored: 'redis' };
  } catch (err) {
    return {
      ok: false,
      stored: 'none',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchPublicUptimeChecks(params: {
  sinceIso: string;
  limit: number;
}): Promise<PublicUptimeRow[]> {
  const { sinceIso, limit } = params;
  const admin = createSupabaseAdminClient();

  // 1) Prefer DB if available.
  try {
    const res = await admin
      .from('public_uptime_checks')
      .select('checked_at, ok, latency_ms, source')
      .gte('checked_at', sinceIso)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (!res.error) {
      return ((res.data ?? []) as PublicUptimeRow[]).slice(0, limit);
    }

    if (!isMissingTableError(res.error)) {
      return [];
    }
  } catch (err) {
    if (!isMissingTableError(err)) {
      return [];
    }
  }

  // 2) Redis fallback.
  try {
    const redis = getRedisClient();
    if (!redis) return [];
    const values =
      (await redis.lrange<string>(REDIS_KEY, 0, Math.max(0, limit - 1))) || [];
    const parsed = values
      .map((v) => {
        try {
          return JSON.parse(v) as PublicUptimeRow;
        } catch {
          return null;
        }
      })
      .filter((r): r is PublicUptimeRow => Boolean(r?.checked_at));

    return parsed
      .filter((r) => r.checked_at >= sinceIso)
      .slice(0, limit);
  } catch {
    return [];
  }
}
