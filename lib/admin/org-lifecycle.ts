import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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
}) {
  const nowIso = new Date().toISOString();

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
    })
    .eq('id', args.orgId);

  await lockOrganizationAccess(args.admin, args.orgId);
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
