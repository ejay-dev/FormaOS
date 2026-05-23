import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getRedisConfig } from '@/lib/redis/client';
import { processEnterpriseExportJob } from '@/lib/export/enterprise-export';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

const DEFAULT_LIMIT = 2;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handleEnterpriseExportsCron(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  // If the Redis queue is configured, prefer the queue worker to avoid double-processing.
  const redisCfg = getRedisConfig();
  if (redisCfg.restUrl && redisCfg.token) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'redis_queue_enabled',
    });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const batch = Number.isFinite(limit)
    ? Math.max(0, Math.min(limit, 5))
    : DEFAULT_LIMIT;

  const admin = createSupabaseAdminClient();

  // Audit cron-001 (2026-05-22): atomic claim via SECURITY DEFINER RPC
  // `claim_enterprise_export_jobs` so a Vercel retry or a parallel caller
  // (queue worker / internal-trigger endpoint) can't double-process the
  // same pending job. Mirrors `claim_compliance_export_jobs`.
  const workerId =
    request.headers.get('x-vercel-id') ??
    request.headers.get('x-formaos-worker-id') ??
    `cron-${process.env.VERCEL_DEPLOYMENT_ID ?? 'local'}-${Date.now().toString(36)}`;

  const { data: jobs, error } = await admin.rpc('claim_enterprise_export_jobs', {
    p_limit: batch,
    p_worker_id: workerId,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  let processed = 0;
  let failed = 0;

  for (const j of (jobs ?? []) as Array<{ id: string }>) {
    processed += 1;
    const res = await processEnterpriseExportJob(j.id);
    if (!res.ok) failed += 1;
  }

  return NextResponse.json({
    ok: true,
    claimed: jobs?.length ?? 0,
    processed,
    failed,
  });
}

export async function GET(request: Request) {
  try {
    return handleEnterpriseExportsCron(request);
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    captureRouteError('cron.enterprise-exports', error, {
      method: 'GET',
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return handleEnterpriseExportsCron(request);
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    captureRouteError('cron.enterprise-exports', error, {
      method: 'POST',
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
