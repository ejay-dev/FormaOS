import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/cron/dormant-users-report');

export const runtime = 'nodejs';

// Audit 2026-05-27 — monthly dormant-user review.
//
// Snapshots the dormant_user_candidates view into dormant_user_reviews
// for operator review. Non-destructive: no users are touched, no
// purges queued. Operators read the latest snapshot and decide which
// (if any) candidates to enqueue via the existing P0-8 purge endpoint.
//
// Threshold configurable via DORMANT_USER_DAYS (default 730 = 2 years).

const DEFAULT_THRESHOLD_DAYS = 730;

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const thresholdDays = (() => {
    const env = (process.env.DORMANT_USER_DAYS ?? '').trim();
    const parsed = Number.parseInt(env, 10);
    if (!Number.isFinite(parsed) || parsed < 30) return DEFAULT_THRESHOLD_DAYS;
    return parsed;
  })();

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc('snapshot_dormant_users', {
    p_threshold_days: thresholdDays,
  });

  if (error) {
    log.error({ err: error, thresholdDays }, 'snapshot_dormant_users failed');
    return NextResponse.json(
      { error: 'snapshot_failed', detail: error.message },
      { status: 500 },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  log.info(
    { reviewId: result?.review_id, candidateCount: result?.candidate_count, thresholdDays },
    'dormant-user snapshot recorded',
  );

  return NextResponse.json({
    reviewId: result?.review_id ?? null,
    candidateCount: result?.candidate_count ?? 0,
    thresholdDays,
  });
}
