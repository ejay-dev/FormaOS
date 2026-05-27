import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { routeLog } from '@/lib/monitoring/server-logger';
import { enqueueUserPurge, PurgeRefusedError } from '@/lib/admin/gdpr-purge';

const log = routeLog('/api/cron/process-dormant-user-purges');

export const runtime = 'nodejs';

// Audit 2026-05-27 (Tier 4.4) — 36-month hard-delete cron.
//
// Hybrid retention policy: dormant_user_candidates view already flags
// users at 24mo. This cron enqueues a purge job for users >= 36mo
// dormant UNLESS one of three escape hatches applies:
//
//   1. DORMANT_USER_PURGE_ENABLED env flag is not 'true' — global kill
//      switch. Default off. Operator flips when they're ready for
//      auto-deletion to start running.
//   2. The user has an active row in dormant_user_purge_holds —
//      per-user opt-out.
//   3. The user is already in user_purge_jobs — dedupe (the
//      existing process-user-purges cron will handle them).
//
// Caps:
//   * MAX_PURGES_PER_TICK keeps the function bounded. The expectation
//     is "a handful per month" so a low cap is safe.
//
// Failure handling: per-user errors log + skip. enqueueUserPurge throws
// PurgeRefusedError when the user is the sole owner of an active org —
// those orgs should be transferred first; treat as a skip-and-log, not
// a cron failure.

const DEFAULT_THRESHOLD_DAYS = 1095; // 36 months
const MAX_PURGES_PER_TICK = 50;

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  if (process.env.DORMANT_USER_PURGE_ENABLED !== 'true') {
    log.info({}, 'DORMANT_USER_PURGE_ENABLED is not "true" — skipping.');
    return NextResponse.json({ skipped: 'flag_disabled' });
  }

  const thresholdDays = (() => {
    const env = (process.env.DORMANT_USER_PURGE_DAYS ?? '').trim();
    const parsed = Number.parseInt(env, 10);
    if (!Number.isFinite(parsed) || parsed < 365) return DEFAULT_THRESHOLD_DAYS;
    return parsed;
  })();

  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - thresholdDays * 86_400_000).toISOString();

  // Pull candidates: confirmed users, no active org membership,
  // last_sign_in_at or created_at older than the cutoff, no in-flight
  // purge job. Mirrors the dormant_user_candidates view's WHERE clause
  // but with the larger threshold.
  const { data: candidates, error } = await admin
    .schema('auth')
    .from('users')
    .select('id, email, last_sign_in_at, created_at, confirmed_at, deleted_at, banned_until')
    .not('confirmed_at', 'is', null)
    .is('deleted_at', null)
    .is('banned_until', null)
    .or(`last_sign_in_at.lt.${cutoff},and(last_sign_in_at.is.null,created_at.lt.${cutoff})`)
    .limit(MAX_PURGES_PER_TICK * 4);
  if (error) {
    log.error({ err: error }, 'failed to pull dormant candidates');
    return NextResponse.json({ error: 'lookup_failed', detail: error.message }, { status: 500 });
  }

  const candidateIds = (candidates ?? []).map((u: { id: string }) => u.id);
  if (candidateIds.length === 0) {
    return NextResponse.json({ enqueued: 0, skipped_no_candidates: true });
  }

  // Hydrate the three skip reasons in single queries each.
  const [memberRows, holdRows, jobRows] = await Promise.all([
    admin.from('org_members').select('user_id').in('user_id', candidateIds),
    admin
      .from('dormant_user_purge_holds')
      .select('user_id, expires_at')
      .in('user_id', candidateIds),
    admin.from('user_purge_jobs').select('user_id').in('user_id', candidateIds),
  ]);

  const memberSet = new Set(
    (memberRows.data ?? []).map((r: { user_id: string }) => r.user_id),
  );
  const now = Date.now();
  const heldSet = new Set(
    (holdRows.data ?? [])
      .filter(
        (r: { expires_at: string | null }) =>
          !r.expires_at || new Date(r.expires_at).getTime() > now,
      )
      .map((r: { user_id: string }) => r.user_id),
  );
  const queuedSet = new Set(
    (jobRows.data ?? []).map((r: { user_id: string }) => r.user_id),
  );

  let enqueued = 0;
  let refused = 0;
  let skipped = 0;
  let errored = 0;

  for (const user of (candidates ?? []) as Array<{ id: string }>) {
    if (memberSet.has(user.id) || heldSet.has(user.id) || queuedSet.has(user.id)) {
      skipped += 1;
      continue;
    }
    if (enqueued >= MAX_PURGES_PER_TICK) break;

    try {
      await enqueueUserPurge({
        userId: user.id,
        requestedBy: '00000000-0000-0000-0000-000000000000',
        reason: `dormant_retention_${thresholdDays}d`,
        requestSource: 'admin',
      });
      enqueued += 1;
    } catch (err) {
      if (err instanceof PurgeRefusedError) {
        refused += 1;
        log.warn({ userId: user.id }, 'purge refused (sole owner of an org)');
      } else {
        errored += 1;
        log.error({ err, userId: user.id }, 'enqueueUserPurge failed');
      }
    }
  }

  log.info(
    { enqueued, refused, skipped, errored, thresholdDays, candidateCount: candidateIds.length },
    'dormant-user purge tick complete',
  );
  return NextResponse.json({
    enqueued,
    refused,
    skipped,
    errored,
    thresholdDays,
    candidateCount: candidateIds.length,
  });
}
