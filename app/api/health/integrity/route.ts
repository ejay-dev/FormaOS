import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

// Audit 2026-05-25 (SOC2 / PI1.1): public data-integrity probe.
// Returns a minimal `{ status, checks }` shape with up/down indicators
// for the two storage backends a Type 1/2 reviewer would expect to see
// reachable: Postgres (database) and the Supabase storage object plane.
//
// Differs from /api/health/detailed: that endpoint is founder-token
// gated and returns operational internals (memory, RLS counts, env
// var presence). This endpoint is intentionally low-fidelity and
// public so SOC 2 scanners + external trust reviewers can confirm the
// integrity checks are live without seeing anything sensitive.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckStatus = 'healthy' | 'degraded' | 'error';

type CacheEntry = {
  payload: ReturnType<typeof buildPayload>;
  httpStatus: number;
  storedAt: number;
};

// Audit 2026-05-25 follow-up: 5 s in-memory cache + per-check timeout.
// Without these, bursty Supabase Edge latency (occasionally >15 s) made
// the SOC2 PI1.1 probe time out. The cache absorbs back-to-back hits;
// the timeout guarantees the request resolves in ~3.5 s worst case.
const CACHE_TTL_MS = 5_000;
const CHECK_TIMEOUT_MS = 3_000;
let cached: CacheEntry | null = null;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(onTimeout()), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function checkDatabase(): Promise<CheckStatus> {
  return withTimeout(
    (async () => {
      try {
        const supabase = createClient(
          getSupabaseUrl(),
          getSupabaseServiceRoleKey(),
        );
        const { error } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .limit(1);
        return error ? ('degraded' as CheckStatus) : ('healthy' as CheckStatus);
      } catch {
        return 'error' as CheckStatus;
      }
    })(),
    CHECK_TIMEOUT_MS,
    () => 'degraded',
  );
}

async function checkStorage(): Promise<CheckStatus> {
  return withTimeout(
    (async () => {
      try {
        const supabase = createClient(
          getSupabaseUrl(),
          getSupabaseServiceRoleKey(),
        );
        const { error } = await supabase.storage.listBuckets();
        return error ? ('degraded' as CheckStatus) : ('healthy' as CheckStatus);
      } catch {
        return 'error' as CheckStatus;
      }
    })(),
    CHECK_TIMEOUT_MS,
    () => 'degraded',
  );
}

function buildPayload(
  database: CheckStatus,
  storage: CheckStatus,
  startedAt: number,
) {
  const overall: CheckStatus =
    database === 'error' || storage === 'error'
      ? 'error'
      : database === 'degraded' || storage === 'degraded'
        ? 'degraded'
        : 'healthy';

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now() - startedAt,
    checks: {
      database,
      storage,
    },
  };
}

export async function GET() {
  const now = Date.now();

  if (cached && now - cached.storedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.payload, {
      status: cached.httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Integrity-Cache': 'hit',
      },
    });
  }

  const start = Date.now();
  const [database, storage] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ]);

  const payload = buildPayload(database, storage, start);
  const httpStatus = payload.status === 'error' ? 503 : 200;

  cached = { payload, httpStatus, storedAt: Date.now() };

  return NextResponse.json(payload, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Integrity-Cache': 'miss',
    },
  });
}
