import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { billingLogger } from '@/lib/observability/structured-logger';

// Legacy plan_code column uses different values than plan_key
// plan_key: basic, pro, enterprise
// plan_code (legacy FK): starter, pro, enterprise
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

// Default plan if none provided - ensures no "No Plan" users
const DEFAULT_PLAN: PlanKey = 'basic';

export async function ensureSubscription(
  orgId: string,
  planKey: string | null,
) {
  // HARDENING: Default to 'basic' if no valid plan provided
  const resolvedPlan = resolvePlanKey(planKey) || DEFAULT_PLAN;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('org_subscriptions')
    .select('status, plan_key, trial_expires_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing?.status && ['active', 'trialing'].includes(existing.status)) {
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
    status: 'active',
    current_period_end: null,
    trial_started_at: null,
    trial_expires_at: null,
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

  for (const attempt of payloadAttempts) {
    const { error } = await admin
      .from('org_subscriptions')
      .upsert(attempt.payload, { onConflict: 'organization_id' });

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
        attempts: upsertErrors,
      },
      { orgId },
    );
  }

  // Sync entitlements for all plans.
  await syncEntitlementsForPlan(orgId, resolvedPlan);
}
