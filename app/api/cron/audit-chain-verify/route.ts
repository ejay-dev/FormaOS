/* eslint-disable formaos/no-admin-client-with-org-filter --
 * Cross-tenant cron: verifies hash-chain integrity for every org. The
 * admin client is required to span tenants; per-org integrity checks
 * are filtered via `.eq('org_id', orgId)`. Per ENGINEERING_CHANGE_MATRIX
 * "Tenant Data Access" guidance for cron / cross-tenant scans.
 */
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import { verifyChainIntegrity } from '@/lib/audit/hash-utils';

const log = routeLog('/api/cron/audit-chain-verify');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hard cap per org. Mid-2026 the largest orgs have ~12 K audit_log
// rows; this leaves three orders of magnitude of headroom. If a single
// org exceeds the cap, we surface a warning but still verify the head
// of the chain — partial verification still catches the most common
// tamper pattern (modifying recent rows).
const MAX_ENTRIES_PER_ORG = 50_000;

type BreakReport = {
  orgId: string;
  brokenAt: number;
  totalChecked: number;
  reason?: string;
};

async function runAuditChainVerify(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const startedAt = Date.now();
  const admin = createSupabaseAdminClient();

  try {
    // Fetch the distinct set of orgs that have any audit_log rows.
    // We bound this to active organizations only — orgs that have
    // been soft-deleted shouldn't fail the run.
    const { data: orgRows, error: orgErr } = await admin
      .from('audit_log')
      .select('org_id', { count: 'exact', head: false })
      .limit(10_000);

    if (orgErr) {
      log.error({ err: orgErr }, 'failed to enumerate audit_log orgs');
      return NextResponse.json(
        { ok: false, error: 'enumerate_failed', detail: orgErr.message },
        { status: 500 },
      );
    }

    const orgIds = Array.from(
      new Set((orgRows ?? []).map((r) => r.org_id as string)),
    );

    const breaks: BreakReport[] = [];
    const overCap: string[] = [];
    let totalEntriesVerified = 0;

    for (const orgId of orgIds) {
      const { data: entries, error } = await admin
        .from('audit_log')
        .select(
          'id, org_id, user_id, action, resource_type, resource_id, details, created_at, entry_hash, prev_hash, sequence_number, hash_algo',
        )
        .eq('org_id', orgId)
        .order('sequence_number', { ascending: true })
        .limit(MAX_ENTRIES_PER_ORG);

      if (error) {
        log.error({ err: error, orgId }, 'failed to load chain for org');
        continue;
      }

      const rows = (entries ?? []) as Array<
        Parameters<typeof verifyChainIntegrity>[0][number]
      >;

      if (rows.length === MAX_ENTRIES_PER_ORG) {
        overCap.push(orgId);
      }

      const result = verifyChainIntegrity(rows);
      totalEntriesVerified += result.totalChecked;

      if (!result.valid) {
        const report: BreakReport = {
          orgId,
          brokenAt: result.brokenAt ?? -1,
          totalChecked: result.totalChecked,
          reason: result.reason,
        };
        breaks.push(report);

        log.error(
          { ...report, severity: 'CRITICAL' },
          'audit chain tampering detected',
        );

        // Sentry surface for ops paging. Use captureMessage so the
        // signal isn't lost in a "noisy_handler" error grouping.
        Sentry.captureMessage('audit_chain_break', {
          level: 'fatal',
          tags: {
            cron: 'audit-chain-verify',
            org_id: orgId,
            reason: result.reason ?? 'unknown',
          },
          extra: {
            brokenAt: result.brokenAt,
            totalChecked: result.totalChecked,
          },
        });
      }
    }

    const durationMs = Date.now() - startedAt;

    log.info(
      {
        orgs: orgIds.length,
        totalEntriesVerified,
        breaks: breaks.length,
        overCap: overCap.length,
        durationMs,
      },
      'audit chain verification complete',
    );

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      durationMs,
      orgsChecked: orgIds.length,
      totalEntriesVerified,
      breaks,
      overCap,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error in audit-chain-verify');
    captureRouteError('cron.audit-chain-verify', err, {
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
  return runAuditChainVerify(request);
}

export async function POST(request: Request) {
  return runAuditChainVerify(request);
}
