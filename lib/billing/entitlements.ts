import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLAN_CATALOG, PlanKey, resolvePlanKey } from "@/lib/plans";

export type EntitlementKey =
  | "audit_export"
  | "reports"
  | "framework_evaluations"
  | "certifications"
  | "team_limit";

const PLAN_ENTITLEMENTS: Record<PlanKey, { enabled: EntitlementKey[]; limits: Record<string, number> }> = {
  basic: {
    enabled: ["audit_export", "reports", "framework_evaluations", "team_limit"],
    limits: {
      team_limit: PLAN_CATALOG.basic.limits.maxUsers as number,
    },
  },
  pro: {
    enabled: ["audit_export", "reports", "framework_evaluations", "certifications", "team_limit"],
    limits: {
      team_limit: PLAN_CATALOG.pro.limits.maxUsers as number,
    },
  },
  enterprise: {
    enabled: ["audit_export", "reports", "framework_evaluations", "certifications", "team_limit"],
    limits: {},
  },
};

export async function requireActiveSubscription(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_subscriptions")
    .select("plan_key, status, current_period_end")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) {
    throw new Error("Subscription lookup failed");
  }

  if (!data?.status || !["active", "trialing"].includes(data.status)) {
    throw new Error("Subscription inactive");
  }

  if (data.status === "trialing") {
    if (!data.current_period_end) {
      throw new Error("Trial expired");
    }
    const trialEnd = new Date(data.current_period_end).getTime();
    if (Number.isNaN(trialEnd) || Date.now() > trialEnd) {
      throw new Error("Trial expired");
    }
  }

  const planKey = resolvePlanKey(data.plan_key);
  if (!planKey) {
    throw new Error("Subscription plan invalid");
  }

  return { planKey, status: data.status };
}

export async function requireEntitlement(orgId: string, featureKey: EntitlementKey) {
  await requireActiveSubscription(orgId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_entitlements")
    .select("enabled")
    .eq("organization_id", orgId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error) {
    throw new Error("Entitlement lookup failed");
  }

  if (!data?.enabled) {
    throw new Error(`Entitlement blocked: ${featureKey}`);
  }
}

export async function getEntitlementLimit(orgId: string, featureKey: EntitlementKey) {
  await requireActiveSubscription(orgId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_entitlements")
    .select("enabled, limit_value")
    .eq("organization_id", orgId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error) {
    throw new Error("Entitlement lookup failed");
  }

  if (!data?.enabled) {
    throw new Error(`Entitlement blocked: ${featureKey}`);
  }

  return data.limit_value ?? null;
}

export async function syncEntitlementsForPlan(orgId: string, planKey: PlanKey) {
  const admin = createSupabaseAdminClient();
  const plan = PLAN_ENTITLEMENTS[planKey];

  const enabledRecords = plan.enabled.map((featureKey) => ({
    organization_id: orgId,
    feature_key: featureKey,
    enabled: true,
    limit_value: plan.limits[featureKey] ?? null,
  }));

  const limitRecords = Object.entries(plan.limits)
    .filter(([featureKey]) => !plan.enabled.includes(featureKey as EntitlementKey))
    .map(([featureKey, limit]) => ({
      organization_id: orgId,
      feature_key: featureKey,
      enabled: true,
      limit_value: limit,
    }));

  const records = [...enabledRecords, ...limitRecords];
  if (records.length === 0) return;

  await admin.from("org_entitlements").upsert(records, {
    onConflict: "organization_id,feature_key",
  });
}
