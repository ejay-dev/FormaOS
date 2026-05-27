import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getOrgHealthAggregate } from '@/lib/compliance/health/fetch';

const log = routeLog('/api/cron/compliance-health-snapshot');

export const runtime = 'nodejs';

// Audit 2026-05-27 (Tier 2.C) — weekly compliance-health snapshot.
//
// For each organization with at least one enabled framework, compute the
// cross-framework aggregate via lib/compliance/health/aggregate.ts and
// write one row to public.org_compliance_health_snapshots. Powers the
// trend sparkline on /app/compliance/health.
//
// Idempotency: if the org already has a snapshot in the past 24h, the
// cron skips it. Safe to invoke multiple times per week (Vercel only
// runs the scheduled invocation once but operator re-runs during
// debugging won't double-count).
//
// Caps:
//   * MAX_ORGS_PER_TICK keeps the function bounded for the cron timeout.
//   * Per-org failures are logged but do not abort the loop — partial
//     coverage is better than a wedged cron.

const MAX_ORGS_PER_TICK = 500;
const SKIP_WINDOW_HOURS = 24;

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const admin = createSupabaseAdminClient();

  const { data: orgs } = await admin
    .from('org_frameworks')
    .select('organization_id')
    .limit(MAX_ORGS_PER_TICK * 4);

  const orgIds = Array.from(
    new Set(
      ((orgs ?? []) as Array<{ organization_id: string }>).map((r) => r.organization_id),
    ),
  ).slice(0, MAX_ORGS_PER_TICK);

  const cutoff = new Date(Date.now() - SKIP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const orgId of orgIds) {
    try {
      const { count: recent } = await admin
        .from('org_compliance_health_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('snapshot_at', cutoff);

      if ((recent ?? 0) > 0) {
        skipped += 1;
        continue;
      }

      const aggregate = await getOrgHealthAggregate(orgId);
      if (aggregate.overall.framework_count === 0) {
        skipped += 1;
        continue;
      }

      const { error } = await admin
        .from('org_compliance_health_snapshots')
        .insert({
          organization_id: orgId,
          overall_score: aggregate.overall.score,
          framework_count: aggregate.overall.framework_count,
          total_controls: aggregate.overall.total,
          status_counts: aggregate.overall.status_counts,
          frameworks: aggregate.frameworks.map((f) => ({
            slug: f.slug,
            score: f.score,
            total: f.total,
            status_counts: f.status_counts,
          })),
        });
      if (error) {
        log.error({ err: error, orgId }, 'snapshot insert failed');
        failed += 1;
        continue;
      }
      inserted += 1;
    } catch (err) {
      log.error({ err, orgId }, 'snapshot orchestration failed');
      failed += 1;
    }
  }

  log.info({ inserted, skipped, failed, considered: orgIds.length }, 'compliance-health snapshot tick complete');
  return NextResponse.json({ inserted, skipped, failed, considered: orgIds.length });
}
