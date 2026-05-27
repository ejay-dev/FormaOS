import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processReportExportJob } from '@/lib/reports/export-jobs';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { getRedisConfig } from '@/lib/redis/client';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/cron/report-exports');

const DEFAULT_LIMIT = 3;

async function handleReportExportsCron(request: Request) {
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
  const workerId = `cron:${Date.now()}`;

  const admin = createSupabaseAdminClient();
  const { data: jobs, error } = await admin.rpc('claim_report_export_jobs', {
    p_limit: Number.isFinite(limit)
      ? Math.max(0, Math.min(limit, 10))
      : DEFAULT_LIMIT,
    p_worker_id: workerId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs ?? []) {
    processed += 1;
    const result = await processReportExportJob(job.id, {
      workerId,
      maxAttempts: 3,
      preclaimed: true,
    });
    if (!result.ok) failed += 1;
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
    return handleReportExportsCron(request);
  } catch (error) {
    log.error({ err: error }, '[API] Unhandled error:');
    captureRouteError('cron.report-exports', error, {
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
    return handleReportExportsCron(request);
  } catch (error) {
    log.error({ err: error }, '[API] Unhandled error:');
    captureRouteError('cron.report-exports', error, {
      method: 'POST',
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
