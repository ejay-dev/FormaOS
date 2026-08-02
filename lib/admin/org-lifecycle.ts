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

// org_subscriptions.status is the subscription_status enum.
const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'pending_checkout',
  'incomplete',
] as const;

type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// The lock overwrites org_subscriptions.status, destroying the state the org
// was in. Record that state in the admin audit trail so the unlock can put the
// exact value back instead of re-deriving one from billing fields.
const LOCK_SNAPSHOT_ACTION = 'org_access_lock_snapshot';

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
  // org_subscriptions.status is the subscription_status enum
  // (trialing|active|past_due|canceled|pending_checkout|incomplete) — there is
  // no 'pending' member. pending_checkout is the pre-payment state, and with no
  // live trial deadline requireActiveSubscription still denies it.
  return 'pending_checkout';
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

async function readLockStatusSnapshot(
  admin: AdminClient,
  orgId: string,
): Promise<SubscriptionStatus | null> {
  const { data, error } = await admin
    .from('admin_audit_log')
    .select('metadata')
    .eq('action', LOCK_SNAPSHOT_ACTION)
    .eq('target_type', 'organization')
    .eq('target_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    exportLogger.warn('org_lock_snapshot_read_failed', {
      orgId,
      error: error.message,
    });
    return null;
  }

  const row = data?.[0] as
    | { metadata?: Record<string, unknown> | null }
    | undefined;
  const previous = row?.metadata?.previous_subscription_status;

  return typeof previous === 'string' &&
    (SUBSCRIPTION_STATUSES as readonly string[]).includes(previous)
    ? (previous as SubscriptionStatus)
    : null;
}

export async function lockOrganizationAccess(
  admin: AdminClient,
  orgId: string,
  actorUserId?: string,
) {
  // org_id is NOT NULL on org_subscriptions; organization_id is nullable and
  // is not populated by every insert path, so filtering on it can silently
  // match nothing.
  const { data: current, error: readError } = await admin
    .from('org_subscriptions')
    .select('status')
    .eq('org_id', orgId)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `Failed to read organization subscription: ${readError.message}`,
    );
  }

  // 'canceled' is the deny state requireActiveSubscription rejects; the
  // subscription_status enum has no 'blocked' member. An UPDATE rather than an
  // upsert because org_id/plan_code/plan_key are NOT NULL with no defaults —
  // and an org with no subscription row is already denied access.
  const { data: locked, error } = await admin
    .from('org_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .select('org_id');

  if (error) {
    throw new Error(`Failed to lock organization access: ${error.message}`);
  }

  if (!locked || locked.length === 0) {
    exportLogger.warn('org_lock_matched_no_subscription_row', { orgId });
    return;
  }

  const previousStatus = (current as { status?: string } | null)?.status;
  // A second lock without an intervening unlock would otherwise read the
  // deny state written by the first lock and snapshot THAT, so restore would
  // set the org back to 'canceled' and lock it out permanently. The snapshot
  // from the first lock is the authoritative one; leave it alone.
  const alreadyLocked = previousStatus === 'canceled';
  if (actorUserId && previousStatus && !alreadyLocked) {
    const { error: snapshotError } = await admin
      .from('admin_audit_log')
      .insert({
        actor_user_id: actorUserId,
        action: LOCK_SNAPSHOT_ACTION,
        target_type: 'organization',
        target_id: orgId,
        metadata: { previous_subscription_status: previousStatus },
      });

    if (snapshotError) {
      exportLogger.warn('org_lock_snapshot_write_failed', {
        orgId,
        error: snapshotError.message,
      });
    }
  }
}

export async function unlockOrganizationAccess(
  admin: AdminClient,
  orgId: string,
) {
  let status: string | null = await readLockStatusSnapshot(admin, orgId);

  if (!status) {
    const { data: subscription, error: readError } = await admin
      .from('org_subscriptions')
      .select(
        'stripe_subscription_id, trial_expires_at, current_period_end, payment_failures',
      )
      .eq('org_id', orgId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        `Failed to read organization subscription: ${readError.message}`,
      );
    }

    status = resolveSubscriptionStatusForRestore(subscription);
  }

  const { data: unlocked, error } = await admin
    .from('org_subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .select('org_id');

  if (error) {
    throw new Error(`Failed to unlock organization access: ${error.message}`);
  }

  if (!unlocked || unlocked.length === 0) {
    exportLogger.warn('org_unlock_matched_no_subscription_row', { orgId });
  }
}

export async function suspendOrganizationLifecycle(args: {
  admin: AdminClient;
  orgId: string;
  actorUserId: string;
  reason: string;
}) {
  const nowIso = new Date().toISOString();

  // Deny access first: it is the write that actually enforces the suspension,
  // so it must land even if the lifecycle bookkeeping below fails.
  await lockOrganizationAccess(args.admin, args.orgId, args.actorUserId);

  const { error } = await args.admin
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

  if (error) {
    throw new Error(`Failed to suspend organization: ${error.message}`);
  }
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

  // Deny access first: it is the write that actually enforces the retirement,
  // so it must land even if the lifecycle bookkeeping below fails.
  await lockOrganizationAccess(args.admin, args.orgId, args.actorUserId);

  const { error } = await args.admin
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

  if (error) {
    throw new Error(`Failed to retire organization: ${error.message}`);
  }

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

  // Restore access first, for the same reason suspend locks first: it is the
  // write that actually changes what the org can do.
  await unlockOrganizationAccess(args.admin, args.orgId);

  const { error } = await args.admin
    .from('organizations')
    .update({
      lifecycle_status: 'active',
      lifecycle_reason: args.reason,
      is_active: true,
      restored_at: nowIso,
      restored_by: args.actorUserId,
    })
    .eq('id', args.orgId);

  if (error) {
    throw new Error(`Failed to restore organization: ${error.message}`);
  }
}
