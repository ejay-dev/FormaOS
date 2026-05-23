import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

const log = routeLog('/api/cron/security-retention');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function runSecurityRetention(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  try {
    const admin = createSupabaseAdminClient();
    const startedAt = Date.now();

    const { error } = await admin.rpc('cleanup_old_security_data');
    if (error) {
      log.error({ err: error }, "[SecurityRetentionCron] cleanup failed:");
      return NextResponse.json(
        { ok: false, error: 'cleanup_failed', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    log.error({ err: error }, "[SecurityRetentionCron] unexpected error:");
    captureRouteError('cron.security-retention', error, {
      method: request.method,
      url: request.url,
    });
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runSecurityRetention(request);
}

export async function POST(request: Request) {
  return runSecurityRetention(request);
}
