import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";
import { resolvePlanKey, type PlanKey } from "@/lib/plans";

const TRIAL_DAYS = 14;

function getTrialEndIso() {
  const end = new Date();
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end.toISOString();
}

export async function ensureSubscription(orgId: string, planKey: string | null) {
  const resolvedPlan = resolvePlanKey(planKey);
  if (!resolvedPlan) return;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("org_subscriptions")
    .select("status")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (existing?.status) {
    return;
  }

  const isTrialEligible = resolvedPlan === "basic" || resolvedPlan === "pro";
  const now = new Date();
  const nowIso = now.toISOString();
  const trialEndIso = isTrialEligible ? getTrialEndIso() : null;

  await admin.from("org_subscriptions").upsert({
    organization_id: orgId,
    plan_key: resolvedPlan,
    status: isTrialEligible ? "trialing" : "pending",
    current_period_end: trialEndIso,
    trial_started_at: isTrialEligible ? nowIso : null,
    trial_expires_at: trialEndIso,
    updated_at: nowIso,
  });

  if (isTrialEligible) {
    await syncEntitlementsForPlan(orgId, resolvedPlan as Extract<PlanKey, "basic" | "pro">);
  }
}
