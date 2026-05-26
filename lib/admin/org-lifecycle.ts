import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { exportLogger } from '@/lib/observability/structured-logger';

// P0-9 (2026-05-26): retire grace window before retired org data is
// eligible for hard deletion. Read once per process. Default 90 days
// gives ops a window to either restore the org (regret), satisfy any
// outstanding compliance retention, or run the deliberate purge.
function getRetireGraceDays(): number {
  const raw = process.env.ORG_RETIRE_GRACE_DAYS;
  if (!raw) return 90;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 90;
  return parsed;
}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type OrganizationLifecycleStatus = 'active' | 'suspended' | 'retired';

type SubscriptionSnapshot = {
  stripe_subscription_id?: string | null;
  trial_expires_at?: string | null;
  current_period_end?: string | null;
  payment_failures?: number | null;
};

export function resolveSubscriptionStatusForRestore(
  subscription: SubscriptionSnapshot | null | undefined,
) {
  const trialEnd =
    subscription?.trial_expires_at ?? subscription?.current_period_end ?? null;
  const trialActive =
    trialEnd && !Number.isNaN(new Date(trialEnd).getTime())
      ? Date.now() <= new Date(trialEnd).getTime()
      : false;

  if ((subscription?.payment_failures ?? 0) > 0) {
    return 'past_due';
  }
  if (subscription?.stripe_subscription_id) {
    return 'active';
  }
  if (trialActive) {
    return 'trialing';
  }
  return 'pending';
}

export function getEffectiveOrganizationStatus(args: {
  lifecycleStatus?: string | null;
  subscriptionStatus?: string | null;
}) {
  const lifecycleStatus =
    (args.lifecycleStatus as OrganizationLifecycleStatus | null) ?? 'active';
  const subscriptionStatus = args.subscriptionStatus ?? 'pending';

  if (lifecycleStatus === 'suspended') {
    return {
      status: 'suspended',
      lifecycleStatus,
      subscriptionStatus,
    };
  }

  if (lifecycleStatus === 'retired') {
    return {
      status: 'retired',
      lifecycleStatus,
      subscriptionStatus,
    };
  }

  return {
    status: subscriptionStatus,
    lifecycleStatus,
    subscriptionStatus,
  };
}

export async function lockOrganizationAccess(admin: AdminClient, orgId: string) {
  await admin.from('org_subscriptions').upsert({
    organization_id: orgId,
    status: 'blocked',
    updated_at: new Date().toISOString(),
  });
}

export async function unlockOrganizationAccess(
  admin: AdminClient,
  orgId: string,
) {
  const { data: subscription } = await admin
    .from('org_subscriptions')
    .select(
      'stripe_subscription_id, trial_expires_at, current_period_end, payment_failures',
    )
    .eq('organization_id', orgId)
    .maybeSingle();

  const status = resolveSubscriptionStatusForRestore(subscription);

  await admin
    .from('org_subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
}

export async function suspendOrganizationLifecycle(args: {
  admin: AdminClient;
  orgId: string;
  actorUserId: string;
  reason: string;
}) {
  const nowIso = new Date().toISOString();

  await args.admin
    .from('organizations')
    .update({
      lifecycle_status: 'suspended',
      lifecycle_reason: args.reason,
      is_active: false,
      suspended_at: nowIso,
      suspended_by: args.actorUserId,
      restored_at: null,
      restored_by: null,
    })
    .eq('id', args.orgId);

  await lockOrganizationAccess(args.admin, args.orgId);
}

export async function retireOrganizationLifecycle(args: {
  admin: AdminClient;
  orgId: string;
  actorUserId: string;
  reason: string;
}): Promise<{
  retiredAt: string;
  purgeAt: string;
  exportJobId: string | null;
  exportError: string | null;
}> {
  const now = new Date();
  const nowIso = now.toISOString();
  const graceDays = getRetireGraceDays();
  const purgeAt = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);
  const purgeIso = purgeAt.toISOString();

  // P0-9 (2026-05-26): trigger a full enterprise export before the
  // billing/access lock so the org's data is captured in a downloadable
  // bundle. Best-effort — a failure here logs + audits but does not
  // block the retirement. The job id is persisted on the organizations
  // row so ops can later join to enterprise_export_jobs to get the
  // bundle URL.
  let exportJobId: string | null = null;
  let exportError: string | null = null;
  try {
    // Lazy import: the enterprise-export module pulls in lib/queue which
    // initialises Redis at module load. Keep that cost off the import
    // graph for callers that never retire (every server-rendered page).
    const { createEnterpriseExportJob } = await import(
      '@/lib/export/enterprise-export'
    );
    const result = await createEnterpriseExportJob(
      args.orgId,
      args.actorUserId,
      {
        includeCompliance: true,
        includeEvidence: true,
        includeAuditLogs: true,
        includeCareOps: true,
        includeTeam: true,
        bundleType: 'audit_ready_bundle',
        includeReportPdfs: true,
      },
    );
    if (result.ok && result.jobId) {
      exportJobId = result.jobId;
    } else {
      exportError = result.error ?? 'unknown_export_failure';
      exportLogger.warn('org_retire_export_enqueue_failed', {
        orgId: args.orgId,
        error: exportError,
      });
    }
  } catch (err) {
    exportError = err instanceof Error ? err.message : String(err);
    exportLogger.error(
      'org_retire_export_enqueue_threw',
      err instanceof Error ? err : new Error(String(err)),
      { orgId: args.orgId },
    );
  }

  await args.admin
    .from('organizations')
    .update({
      lifecycle_status: 'retired',
      lifecycle_reason: args.reason,
      is_active: false,
      retired_at: nowIso,
      retired_by: args.actorUserId,
      restored_at: null,
      restored_by: null,
      retire_export_job_id: exportJobId,
      retire_purge_at: purgeIso,
    })
    .eq('id', args.orgId);

  await lockOrganizationAccess(args.admin, args.orgId);

  return {
    retiredAt: nowIso,
    purgeAt: purgeIso,
    exportJobId,
    exportError,
  };
}

export async function restoreOrganizationLifecycle(args: {
  admin: AdminClient;
  orgId: string;
  actorUserId: string;
  reason: string;
}) {
  const nowIso = new Date().toISOString();

  await args.admin
    .from('organizations')
    .update({
      lifecycle_status: 'active',
      lifecycle_reason: args.reason,
      is_active: true,
      restored_at: nowIso,
      restored_by: args.actorUserId,
    })
    .eq('id', args.orgId);

  await unlockOrganizationAccess(args.admin, args.orgId);
}
