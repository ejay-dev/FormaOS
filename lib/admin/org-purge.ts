import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin/audit';
import { authLogger } from '@/lib/observability/structured-logger';

// Audit 2026-05-27 — final phase of the org-retire lifecycle (companion
// to P0-9). When an org has been `lifecycle_status='retired'` for
// longer than ORG_RETIRE_GRACE_DAYS (default 90), AND its enterprise
// export job completed successfully, hard-delete the organizations row.
// Cascades through every org_* table via the FKs established in
// migrations 20260403000, 20260624011, 20260624042 (R2 / Phase B
// repointed the last four legacy FKs to organizations(id) ON DELETE
// CASCADE).
//
// SAFETY POSTURE — DESTRUCTIVE OPERATION:
//   * Feature-flagged behind ORG_PURGE_ENABLED=true. Without the flag
//     the cron is a no-op + structured log so the function survives
//     deploy without acting on anything until ops explicitly opts in
//     per environment.
//   * Multi-condition gate per org:
//       - lifecycle_status = 'retired'
//       - retire_purge_at <= now()
//       - retire_export_job_id IS NOT NULL
//       - enterprise_export_jobs.status = 'completed'
//     Failing any check skips the org with a clear log line.
//   * Per-tick cap of MAX_ORGS_PER_TICK. A misconfigured query that
//     selected 500 orgs cannot purge 500 of them in one run.
//   * admin_audit_log entry written BEFORE the delete. The audit chain
//     keeps the record even after the org's own audit rows cascade
//     away — same pattern the GDPR purge uses.
//
// AUDIT-DATA TRADE-OFF (documented):
//   audit_log + org_audit_logs FK to organizations with CASCADE, so
//   the cascade-delete erases the org's hash-chained audit history.
//   That's acceptable here because the retire flow has already
//   exported the full audit bundle (the R1 redactor makes any later
//   re-export of that bundle GDPR-clean). The bundle URL is on the
//   organizations row at retire_export_job_id → enterprise_export_jobs
//   and gets surfaced in the admin audit metadata before the delete.

const PURGE_ACTOR_USER_ID = '00000000-0000-0000-0000-000000000000';
const MAX_ORGS_PER_TICK = 5;

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function isOrgPurgeEnabled(): boolean {
  return (process.env.ORG_PURGE_ENABLED ?? '').trim().toLowerCase() === 'true';
}

type PurgeOutcome =
  | { orgId: string; result: 'purged'; exportJobId: string | null }
  | {
      orgId: string;
      result: 'refused';
      reason:
        | 'no_export_job'
        | 'export_not_completed'
        | 'export_lookup_failed'
        | 'delete_failed';
      detail?: string;
    };

async function checkExportComplete(
  admin: AdminClient,
  exportJobId: string,
): Promise<{ ok: boolean; status?: string; detail?: string }> {
  const { data, error } = await admin
    .from('enterprise_export_jobs')
    .select('status')
    .eq('id', exportJobId)
    .maybeSingle();
  if (error) {
    return { ok: false, detail: error.message };
  }
  if (!data) {
    return { ok: false, detail: 'export_job_not_found' };
  }
  const status = (data as { status?: unknown }).status;
  if (typeof status !== 'string') {
    return { ok: false, detail: 'invalid_status' };
  }
  return { ok: status === 'completed', status };
}

/**
 * Find every retired org whose grace window has elapsed. Capped at
 * MAX_ORGS_PER_TICK so a misconfigured query / runaway state can't
 * cascade-delete the entire tenant base in one cron run.
 */
async function findEligibleOrgs(admin: AdminClient) {
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('organizations')
    .select('id, name, retire_purge_at, retire_export_job_id')
    .eq('lifecycle_status', 'retired')
    .not('retire_purge_at', 'is', null)
    .lte('retire_purge_at', nowIso)
    .order('retire_purge_at', { ascending: true })
    .limit(MAX_ORGS_PER_TICK);
  if (error) {
    throw new Error(`org-purge eligible lookup failed: ${error.message}`);
  }
  return (data ?? []) as Array<{
    id: string;
    name: string | null;
    retire_purge_at: string;
    retire_export_job_id: string | null;
  }>;
}

/**
 * Purge one org. Writes an admin audit entry BEFORE the delete, then
 * runs DELETE FROM organizations WHERE id = X (cascade does the rest).
 * Returns a structured outcome; caller aggregates per cron tick.
 */
async function purgeOneOrg(
  admin: AdminClient,
  org: {
    id: string;
    name: string | null;
    retire_purge_at: string;
    retire_export_job_id: string | null;
  },
): Promise<PurgeOutcome> {
  if (!org.retire_export_job_id) {
    return { orgId: org.id, result: 'refused', reason: 'no_export_job' };
  }

  const exportCheck = await checkExportComplete(admin, org.retire_export_job_id);
  if (!exportCheck.ok) {
    return {
      orgId: org.id,
      result: 'refused',
      reason: exportCheck.detail === 'export_job_not_found'
        ? 'export_lookup_failed'
        : 'export_not_completed',
      detail: `export_status=${exportCheck.status ?? 'unknown'}${exportCheck.detail ? ` (${exportCheck.detail})` : ''}`,
    };
  }

  // Write the audit entry BEFORE the cascade. After the delete the
  // org's own audit_log rows are gone (FK ON DELETE CASCADE), so the
  // admin_audit_log (platform-scoped, not org-FK'd) is the only
  // permanent record of the purge.
  await logAdminAction({
    actorUserId: PURGE_ACTOR_USER_ID,
    action: 'org_purge_executed',
    targetType: 'organization',
    targetId: org.id,
    metadata: {
      org_name: org.name,
      retire_purge_at: org.retire_purge_at,
      retire_export_job_id: org.retire_export_job_id,
      max_per_tick: MAX_ORGS_PER_TICK,
    },
  });

  const { error: deleteError } = await admin
    .from('organizations')
    .delete()
    .eq('id', org.id);

  if (deleteError) {
    // Audit the failure separately so the trail shows attempt + outcome.
    await logAdminAction({
      actorUserId: PURGE_ACTOR_USER_ID,
      action: 'org_purge_failed',
      targetType: 'organization',
      targetId: org.id,
      metadata: { error: deleteError.message },
    });
    return {
      orgId: org.id,
      result: 'refused',
      reason: 'delete_failed',
      detail: deleteError.message,
    };
  }

  return {
    orgId: org.id,
    result: 'purged',
    exportJobId: org.retire_export_job_id,
  };
}

/**
 * Drive one cron tick. Bounded by MAX_ORGS_PER_TICK + the feature
 * flag. Returns per-org outcomes for the route to surface in its
 * response + structured log.
 */
export async function runOrgPurgeTick(): Promise<{
  enabled: boolean;
  picked: number;
  outcomes: PurgeOutcome[];
}> {
  if (!isOrgPurgeEnabled()) {
    authLogger.info('org_purge_skipped_feature_flag', {
      env: process.env.NODE_ENV,
    });
    return { enabled: false, picked: 0, outcomes: [] };
  }

  const admin = createSupabaseAdminClient();
  const eligible = await findEligibleOrgs(admin);
  const outcomes: PurgeOutcome[] = [];

  for (const org of eligible) {
    const outcome = await purgeOneOrg(admin, org);
    outcomes.push(outcome);
  }

  authLogger.info('org_purge_tick_complete', {
    picked: eligible.length,
    purged: outcomes.filter((o) => o.result === 'purged').length,
    refused: outcomes.filter((o) => o.result === 'refused').length,
  });

  return { enabled: true, picked: eligible.length, outcomes };
}
