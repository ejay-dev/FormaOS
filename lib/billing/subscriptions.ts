import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";
import { resolvePlanKey, type PlanKey } from "@/lib/plans";

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
  return planKey === "basic" ? "starter" : planKey;
}

// Default plan if none provided - ensures no "No Plan" users
const DEFAULT_PLAN: PlanKey = "basic";

export async function ensureSubscription(orgId: string, planKey: string | null) {
  // HARDENING: Default to 'basic' if no valid plan provided
  const resolvedPlan = resolvePlanKey(planKey) || DEFAULT_PLAN;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("org_subscriptions")
    .select("status, plan_key")
    .eq("organization_id", orgId)
    .maybeSingle();

  // If subscription exists with valid status, just ensure entitlements
  if (existing?.status && ["active", "trialing"].includes(existing.status)) {
    // BACKFILL: Ensure entitlements exist even for existing subscriptions
    const existingPlan = resolvePlanKey(existing.plan_key) || resolvedPlan;
    if (existingPlan === "basic" || existingPlan === "pro") {
      await syncEntitlementsForPlan(orgId, existingPlan);
    }
    return;
  }

  const isTrialEligible = resolvedPlan === "basic" || resolvedPlan === "pro";
  const now = new Date();
  const nowIso = now.toISOString();
  const trialEndIso = isTrialEligible ? getTrialEndIso() : null;

  const basePayload = {
    organization_id: orgId,
    plan_key: resolvedPlan,
    status: isTrialEligible ? "trialing" : "pending",
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
    .from("org_subscriptions")
    .upsert(legacyPayload);

  if (legacyError) {
    const message = legacyError.message?.toLowerCase() ?? "";
    const missingLegacyColumn =
      message.includes("column \"org_id\" does not exist") ||
      message.includes("column \"plan_code\" does not exist");

    if (missingLegacyColumn) {
      const { error: fallbackError } = await admin
        .from("org_subscriptions")
        .upsert(basePayload);
      if (fallbackError) {
        console.error("[ensureSubscription] fallback upsert failed", fallbackError);
      }
    } else {
      console.error("[ensureSubscription] upsert failed", legacyError);
    }
  }

  // Always sync entitlements for trial-eligible plans
  if (isTrialEligible) {
    await syncEntitlementsForPlan(orgId, resolvedPlan as Extract<PlanKey, "basic" | "pro">);
  }
}
