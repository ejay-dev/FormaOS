/**
 * =========================================================
 * Entitlement Drift Detector
 * =========================================================
 * Detects and corrects entitlement drift between plan definitions and actual entitlements
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncEntitlementsForPlan, type EntitlementKey } from "@/lib/billing/entitlements";
import { PLAN_CATALOG, resolvePlanKey, type PlanKey } from "@/lib/plans";
import { billingLogger } from "@/lib/observability/structured-logger";

export interface EntitlementSet {
  enabled: EntitlementKey[];
  limits: Record<string, number | null>;
}

export interface EntitlementCorrection {
  featureKey: string;
  type: "missing" | "extra" | "limit_mismatch" | "disabled";
  expected: unknown;
  actual: unknown;
  corrected: boolean;
}

export interface DriftDetectionResult {
  hasDrift: boolean;
  expected: EntitlementSet;
  actual: EntitlementSet;
  corrections: EntitlementCorrection[];
  autoFixed: boolean;
}

// Source of truth for plan entitlements
const PLAN_ENTITLEMENTS: Record<PlanKey, EntitlementSet> = {
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
    limits: {
      team_limit: null, // Unlimited
    },
  },
};

/**
 * Detect entitlement drift for a specific organization
 */
export async function detectEntitlementDrift(
  orgId: string,
  autoFix: boolean = true
): Promise<DriftDetectionResult> {
  const admin = createSupabaseAdminClient();
  const corrections: EntitlementCorrection[] = [];

  // Get current subscription
  const { data: subscription, error: subError } = await admin
    .from("org_subscriptions")
    .select("plan_key, status")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (subError || !subscription) {
    return {
      hasDrift: false,
      expected: { enabled: [], limits: {} },
      actual: { enabled: [], limits: {} },
      corrections: [],
      autoFixed: false,
    };
  }

  const planKey = resolvePlanKey(subscription.plan_key);
  if (!planKey) {
    return {
      hasDrift: false,
      expected: { enabled: [], limits: {} },
      actual: { enabled: [], limits: {} },
      corrections: [],
      autoFixed: false,
    };
  }

  const expected = PLAN_ENTITLEMENTS[planKey];

  // Get current entitlements
  const { data: currentEntitlements, error: entError } = await admin
    .from("org_entitlements")
    .select("feature_key, enabled, limit_value")
    .eq("organization_id", orgId);

  if (entError) {
    billingLogger.error("drift_detection_failed", {
      code: "ENTITLEMENT_FETCH_ERROR",
      message: entError.message,
    }, { orgId });
    throw new Error(`Failed to fetch entitlements: ${entError.message}`);
  }

  // Build actual entitlement set
  const actual: EntitlementSet = {
    enabled: [],
    limits: {},
  };

  const entitlementMap = new Map<string, { enabled: boolean; limit: number | null }>();

  for (const ent of currentEntitlements || []) {
    entitlementMap.set(ent.feature_key, {
      enabled: ent.enabled ?? false,
      limit: ent.limit_value ?? null,
    });

    if (ent.enabled) {
      actual.enabled.push(ent.feature_key as EntitlementKey);
    }
    actual.limits[ent.feature_key] = ent.limit_value ?? null;
  }

  // Check for missing entitlements
  for (const featureKey of expected.enabled) {
    const current = entitlementMap.get(featureKey);

    if (!current) {
      corrections.push({
        featureKey,
        type: "missing",
        expected: true,
        actual: undefined,
        corrected: false,
      });
    } else if (!current.enabled) {
      corrections.push({
        featureKey,
        type: "disabled",
        expected: true,
        actual: false,
        corrected: false,
      });
    }
  }

  // Check for limit mismatches
  for (const [featureKey, expectedLimit] of Object.entries(expected.limits)) {
    const current = entitlementMap.get(featureKey);

    if (current && current.limit !== expectedLimit) {
      corrections.push({
        featureKey,
        type: "limit_mismatch",
        expected: expectedLimit,
        actual: current.limit,
        corrected: false,
      });
    }
  }

  // Check for extra entitlements (enabled but not in plan)
  for (const ent of currentEntitlements || []) {
    if (ent.enabled && !expected.enabled.includes(ent.feature_key as EntitlementKey)) {
      // Don't flag as drift if it's a limit-only entitlement
      if (!Object.keys(expected.limits).includes(ent.feature_key)) {
        corrections.push({
          featureKey: ent.feature_key,
          type: "extra",
          expected: false,
          actual: true,
          corrected: false,
        });
      }
    }
  }

  const hasDrift = corrections.length > 0;
  let autoFixed = false;

  // Auto-fix if enabled and drift detected
  if (hasDrift && autoFix && ["active", "trialing"].includes(subscription.status || "")) {
    try {
      await syncEntitlementsForPlan(orgId, planKey);

      // Mark all corrections as fixed
      for (const correction of corrections) {
        correction.corrected = true;
      }
      autoFixed = true;

      billingLogger.info("entitlement_drift_fixed", {
        orgId,
        planKey,
        corrections: corrections.length,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      billingLogger.error("entitlement_drift_fix_failed", err, { orgId, planKey });
    }
  }

  return {
    hasDrift,
    expected,
    actual,
    corrections,
    autoFixed,
  };
}

/**
 * Scan all organizations for entitlement drift
 */
export async function scanAllForEntitlementDrift(options?: {
  autoFix?: boolean;
  limit?: number;
}): Promise<{
  scanned: number;
  withDrift: number;
  autoFixed: number;
  errors: string[];
}> {
  const admin = createSupabaseAdminClient();
  const autoFix = options?.autoFix ?? true;
  const limit = options?.limit ?? 1000;

  const { data: subscriptions, error } = await admin
    .from("org_subscriptions")
    .select("organization_id")
    .in("status", ["active", "trialing"])
    .limit(limit);

  if (error) {
    billingLogger.error("drift_scan_failed", {
      code: "SUBSCRIPTION_FETCH_ERROR",
      message: error.message,
    });
    return {
      scanned: 0,
      withDrift: 0,
      autoFixed: 0,
      errors: [error.message],
    };
  }

  const subs = subscriptions || [];
  const errors: string[] = [];
  let withDrift = 0;
  let autoFixed = 0;

  for (const sub of subs) {
    try {
      const result = await detectEntitlementDrift(sub.organization_id, autoFix);
      if (result.hasDrift) {
        withDrift++;
        if (result.autoFixed) {
          autoFixed++;
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      errors.push(`Org ${sub.organization_id}: ${error}`);
    }
  }

  billingLogger.info("drift_scan_completed", {
    scanned: subs.length,
    withDrift,
    autoFixed,
    errors: errors.length,
  });

  return {
    scanned: subs.length,
    withDrift,
    autoFixed,
    errors,
  };
}
