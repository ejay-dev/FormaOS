import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { isSelfServePlan } from '@/lib/billing/checkout-intent';
import { billingLogger } from '@/lib/observability/structured-logger';

// Legacy plan_code column uses different values than plan_key
// plan_key: basic, pro, enterprise
// plan_code (legacy FK): starter, pro, enterprise
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

// Default plan if none provided - ensures no "No Plan" users
const DEFAULT_PLAN: PlanKey = 'basic';

// 24-hour grace window for self-serve buyers between org bootstrap and Stripe
// checkout completion. The layout-level gate at app/app/layout.tsx redirects
// pending_checkout users to /app/billing immediately, so this window only
// covers the brief seconds-to-minutes between bootstrap and the first server
// action that calls requireActiveSubscription. Reduced from 14 days (which
// implied a "free trial" that does not exist — High-9) to 1 day so the system
// matches the marketed "pay before access" stance.
const PENDING_CHECKOUT_GRACE_DAYS = 1;

export type EnsureSubscriptionOptions = {
  /**
   * 'self-serve' (default) — for self-serve plans (basic/pro/scale), create
   * a `pending_checkout` row with a grace window that forces the user
   * through Stripe Checkout before app access. Enterprise stays 'active'.
   *
   * 'active' — used by admin paths and Stripe webhook callers that have
   * out-of-band evidence of payment / contract; bypasses the checkout gate.
   */
  intent?: 'self-serve' | 'active';
};

export async function ensureSubscription(
  orgId: string,
  planKey: string | null,
  options: EnsureSubscriptionOptions = {},
) {
  // HARDENING: Default to 'basic' if no valid plan provided
  const resolvedPlan = resolvePlanKey(planKey) || DEFAULT_PLAN;
  const intent = options.intent ?? 'self-serve';

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('org_subscriptions')
    .select('status, plan_key, trial_expires_at, stripe_subscription_id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (
    existing?.status &&
    ['active', 'trialing', 'pending_checkout'].includes(existing.status)
  ) {
    const isExpiredTrial =
      existing.status === 'trialing' &&
      existing.trial_expires_at &&
      Date.now() > new Date(existing.trial_expires_at).getTime();

    if (!isExpiredTrial) {
      const existingPlan = resolvePlanKey(existing.plan_key) || resolvedPlan;
      await syncEntitlementsForPlan(orgId, existingPlan);
      return;
    }

    billingLogger.info('expired_evaluation_detected_converting_to_active', {
      orgId,
      previousExpiry: existing.trial_expires_at,
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Decide the initial status. Self-serve plans must complete Stripe Checkout
  // before getting `active`; enterprise is contracted offline so admin/webhook
  // callers can opt into 'active' directly.
  const requiresCheckout =
    intent === 'self-serve' &&
    isSelfServePlan(resolvedPlan) &&
    !existing?.stripe_subscription_id;

  const initialStatus = requiresCheckout ? 'pending_checkout' : 'active';
  const trialExpiresAt = requiresCheckout
    ? new Date(
        now.getTime() + PENDING_CHECKOUT_GRACE_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  // BACKFILL: Ensure legacy orgs table entry exists for org_subscriptions.org_id FK
  try {
    const { data: org } = await admin
      .from('organizations')
      .select('name, created_by')
      .eq('id', orgId)
      .maybeSingle();

    if (org?.name) {
      const { error: legacyOrgError } = await admin.from('orgs').upsert(
        {
          id: orgId,
          name: org.name,
          created_by: org.created_by ?? null,
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'id' },
      );

      if (legacyOrgError) {
        billingLogger.warn('legacy_orgs_upsert_failed', { orgId, error: legacyOrgError.message });
      }
    }
  } catch (error) {
    billingLogger.warn('legacy_orgs_backfill_error', {
      orgId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const basePayload = {
    organization_id: orgId,
    plan_key: resolvedPlan,
    status: initialStatus,
    current_period_end: null,
    trial_started_at: null,
    trial_expires_at: trialExpiresAt,
    updated_at: nowIso,
  };

  const legacyPayload = {
    ...basePayload,
    org_id: orgId, // Legacy column (present in some production schemas)
    plan_code: toLegacyPlanCode(resolvedPlan), // Legacy column (starter vs basic)
  };

  const payloadAttempts = [
    { label: 'legacy_full', payload: legacyPayload },
    { label: 'legacy_org_id', payload: { ...basePayload, org_id: orgId } },
    {
      label: 'legacy_plan_code',
      payload: { ...basePayload, plan_code: toLegacyPlanCode(resolvedPlan) },
    },
    { label: 'base', payload: basePayload },
  ];

  let upserted = false;
  const upsertErrors: Array<{ label: string; message: string }> = [];

  // Some Supabase environments still have a `subscription_status` enum that
  // predates the `pending_checkout` value (the enum was created out-of-band
  // and not in repo migrations). Migration 20260507 adds the value; this
  // fallback keeps the gate functional even before that migration runs by
  // demoting to `past_due`, which is also rejected by requireActiveSubscription
  // and triggers the same billing-redirect path.
  const enumIncompatible = (message: string) =>
    /invalid input value for enum (?:public\.)?subscription_status/i.test(
      message,
    );

  for (const attempt of payloadAttempts) {
    let payload = attempt.payload;
    let { error } = await admin
      .from('org_subscriptions')
      .upsert(payload, { onConflict: 'organization_id' });

    if (
      error &&
      payload.status === 'pending_checkout' &&
      enumIncompatible(error.message ?? '')
    ) {
      billingLogger.warn('pending_checkout_enum_missing_falling_back_to_past_due', {
        orgId,
        attempt: attempt.label,
      });
      payload = { ...payload, status: 'past_due' };
      ({ error } = await admin
        .from('org_subscriptions')
        .upsert(payload, { onConflict: 'organization_id' }));
    }

    if (!error) {
      upserted = true;
      break;
    }

    upsertErrors.push({
      label: attempt.label,
      message: error.message ?? 'Unknown error',
    });
  }

  if (!upserted) {
    billingLogger.error(
      'subscription_upsert_failed',
      {
        code: 'UPSERT_ERROR',
        message: upsertErrors
          .map((error) => `${error.label}: ${error.message}`)
          .join(' | '),
      },
      { orgId },
    );
  }

  // Sync entitlements for all plans.
  await syncEntitlementsForPlan(orgId, resolvedPlan);
}
