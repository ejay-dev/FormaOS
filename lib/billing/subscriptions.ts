import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import {
  isTrialEligiblePlan,
  resolvePlanKey,
  type PlanKey,
} from '@/lib/plans';
import { billingLogger } from '@/lib/observability/structured-logger';

const TRIAL_DAYS = 14;

function getTrialEndIso() {
  const end = new Date();
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end.toISOString();
}

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

  // If subscription exists with valid status, check if trial is still active
  if (existing?.status && ['active', 'trialing'].includes(existing.status)) {
    // Check for EXPIRED trials — a 'trialing' status with a past expiration date
    // means the user's free trial has ended. Reset to a fresh trial so returning
    // users aren't permanently locked out of the app.
    const isExpiredTrial =
      existing.status === 'trialing' &&
      existing.trial_expires_at &&
      Date.now() > new Date(existing.trial_expires_at).getTime();

    if (!isExpiredTrial) {
      // Active subscription or active trial — just ensure entitlements
      const existingPlan = resolvePlanKey(existing.plan_key) || resolvedPlan;
      await syncEntitlementsForPlan(orgId, existingPlan);
      return;
    }

    // Expired trial: fall through to create a fresh trial subscription below
    billingLogger.info('expired_trial_detected_refreshing', {
      orgId,
      previousExpiry: existing.trial_expires_at,
    });
  }

  const isTrialEligible = isTrialEligiblePlan(resolvedPlan);
  const now = new Date();
  const nowIso = now.toISOString();
  const trialEndIso = isTrialEligible ? getTrialEndIso() : null;

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
    status: isTrialEligible ? 'trialing' : 'active',
    current_period_end: trialEndIso,
    trial_started_at: isTrialEligible ? nowIso : null,
    trial_expires_at: trialEndIso,
    updated_at: nowIso,
  };

  const legacyPayload = {
    ...basePayload,
    org_id: orgId, // Legacy column (present in some production schemas)
    plan_code: toLegacyPlanCode(resolvedPlan), // Legacy column (starter vs basic)
  };

  const { error: legacyError } = await admin
    .from('org_subscriptions')
    .upsert(legacyPayload);

  if (legacyError) {
    const message = legacyError.message?.toLowerCase() ?? '';
    const legacySchemaIssue =
      message.includes('column "org_id" does not exist') ||
      message.includes('column "plan_code" does not exist') ||
      message.includes('foreign key constraint') ||
      message.includes('plan_code_fkey');

    if (legacySchemaIssue) {
      const { error: fallbackError } = await admin
        .from('org_subscriptions')
        .upsert(basePayload);
      if (fallbackError) {
        billingLogger.error('subscription_upsert_failed', {
          code: 'FALLBACK_UPSERT_ERROR',
          message: fallbackError.message,
        }, { orgId });
      }
    } else {
      billingLogger.error('subscription_upsert_failed', {
        code: 'UPSERT_ERROR',
        message: legacyError.message ?? 'Unknown error',
      }, { orgId });
    }
  }

  // Sync entitlements for all plans (trial-eligible + enterprise)
  await syncEntitlementsForPlan(orgId, resolvedPlan);
}
