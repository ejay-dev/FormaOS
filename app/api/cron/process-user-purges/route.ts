import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processUserPurge } from '@/lib/admin/gdpr-purge';
import { authLogger } from '@/lib/observability/structured-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Audit 2026-05-26 — P0-8: GDPR purge processor.
//
// Picks up every pending user_purge_jobs row and runs processUserPurge
// for it. Hourly schedule keeps the AU Privacy Act "as soon as
// reasonably practicable" window honest without burning function
// budget. Bounded to 25 jobs per tick — typical volume is "one or two
// a week", anything bigger is operationally suspicious and worth a
// human look anyway.

const MAX_JOBS_PER_TICK = 25;

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const admin = createSupabaseAdminClient();

  const { data: pending, error: listErr } = await admin
    .from('user_purge_jobs')
    .select('id')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })
    .limit(MAX_JOBS_PER_TICK);

  if (listErr) {
    authLogger.error(
      'gdpr_purge_processor_list_failed',
      new Error(listErr.message),
    );
    return NextResponse.json(
      { error: 'pending lookup failed' },
      { status: 500 },
    );
  }

  const jobs = pending ?? [];
  let completed = 0;
  let partial = 0;
  let failed = 0;
  const errors: Array<{ jobId: string; message: string }> = [];

  for (const job of jobs) {
    const jobId = (job as { id: string }).id;
    try {
      const result = await processUserPurge(jobId);
      if (result.status === 'completed') completed += 1;
      else if (result.status === 'partial') partial += 1;
      else failed += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ jobId, message });
      authLogger.error(
        'gdpr_purge_processor_job_threw',
        err instanceof Error ? err : new Error(message),
        { jobId },
      );
    }
  }

  authLogger.info('gdpr_purge_processor_tick', {
    picked: jobs.length,
    completed,
    partial,
    failed,
  });

  return NextResponse.json({
    ok: true,
    picked: jobs.length,
    completed,
    partial,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
