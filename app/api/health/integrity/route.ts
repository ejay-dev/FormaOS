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

async function checkDatabase(): Promise<CheckStatus> {
  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const { error } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    return error ? 'degraded' : 'healthy';
  } catch {
    return 'error';
  }
}

async function checkStorage(): Promise<CheckStatus> {
  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
    const { error } = await supabase.storage.listBuckets();
    return error ? 'degraded' : 'healthy';
  } catch {
    return 'error';
  }
}

export async function GET() {
  const start = Date.now();

  const [database, storage] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ]);

  const overall: CheckStatus =
    database === 'error' || storage === 'error'
      ? 'error'
      : database === 'degraded' || storage === 'degraded'
        ? 'degraded'
        : 'healthy';

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - start,
      checks: {
        database,
        storage,
      },
    },
    {
      status: overall === 'error' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}
