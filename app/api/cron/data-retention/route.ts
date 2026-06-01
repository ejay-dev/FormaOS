import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { executeRetention } from '@/lib/data-governance/retention';

const log = routeLog('/api/cron/data-retention');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bound the per-run org sweep so a slow org can't burn the entire Vercel
// maxDuration window. Successive nightly runs cover every org because we
// order by `last_retention_at NULLS FIRST` — orgs never swept (NULL) or
// least-recently swept go first, and `executeRetention` stamps the column
// when it finishes (audit M8: the previous `order by id` only ever
// processed the same first 250 orgs, starving orgs ranked 251+).
const MAX_ORGS_PER_RUN = 250;

type OrgErrorReport = { orgId: string; error: string };

async function runRetention(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const startedAt = Date.now();
  const admin = createSupabaseAdminClient();

  try {
    // Enumerate active orgs, least-recently-swept first. Soft-deleted orgs
    // are intentionally skipped — their data is already in retention by
    // virtue of the org being inactive. If the `last_retention_at` column
    // isn't deployed yet (migration applied out of order), fall back to a
    // deterministic id sweep so the cron never hard-fails.
    let orgs: Array<{ id: string }> | null = null;
    let enumError: { message: string } | null = null;
    ({ data: orgs, error: enumError } = await admin
      .from('organizations')
      .select('id')
      .eq('is_active', true)
      .order('last_retention_at', { ascending: true, nullsFirst: true })
      .order('id', { ascending: true })
      .limit(MAX_ORGS_PER_RUN));

    if (enumError) {
      log.warn(
        { err: enumError },
        'last_retention_at ordering failed — falling back to id sweep',
      );
      ({ data: orgs, error: enumError } = await admin
        .from('organizations')
        .select('id')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .limit(MAX_ORGS_PER_RUN));
    }

    if (enumError) {
      log.error({ err: enumError }, 'failed to enumerate orgs');
      return NextResponse.json(
        { ok: false, error: 'enumerate_failed' },
        { status: 500 },
      );
    }

    const orgIds = ((orgs ?? []) as Array<{ id: string }>).map((o) => o.id);
    const errors: OrgErrorReport[] = [];
    let totalOrgsProcessed = 0;

    for (const orgId of orgIds) {
      try {
        await executeRetention(orgId, /* dryRun */ false);
        totalOrgsProcessed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ orgId, error: message });
        log.error(
          { err, orgId },
          'retention execution failed for org — continuing',
        );
        Sentry.captureException(err, {
          tags: {
            cron: 'data-retention',
            org_id: orgId,
          },
        });
      }
    }

    const durationMs = Date.now() - startedAt;
    log.info(
      {
        orgsProcessed: totalOrgsProcessed,
        orgsAttempted: orgIds.length,
        errors: errors.length,
        durationMs,
      },
      'data retention sweep complete',
    );

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      durationMs,
      orgsAttempted: orgIds.length,
      orgsProcessed: totalOrgsProcessed,
      errors,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error in data-retention cron');
    captureRouteError('cron.data-retention', err, {
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
  return runRetention(request);
}

export async function POST(request: Request) {
  return runRetention(request);
}
