/**
 * =========================================================
 * Nightly Billing Reconciliation
 * =========================================================
 * Compares local subscription state with Stripe to detect and fix discrepancies
 *
 * Tenant isolation note: this module is intentionally cross-tenant. It runs
 * as a nightly cron, iterates every org's `org_subscriptions` row, and
 * compares each against Stripe. The admin-client pattern is required;
 * `createSupabaseOrgClient(orgId)` would defeat the scan by scoping each
 * query back to a single tenant. The org filter on writes
 * (`eq('organization_id', sub.organization_id)`) is enforced from the
 * current iteration's row, not from caller input.
 *
 * Tracked under the tenant-isolation ratchet
 * (scripts/check-tenant-isolation-ratchet.mjs); flips to the on-demand
 * `npm run lint:tenant-isolation` punch list rather than a per-call
 * disable directive (the rule is OFF in the default config, so
 * `eslint-disable` here would trigger an "unused directive" warning).
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStripeClient,
  resolvePlanKeyFromPriceId,
  subscriptionPeriodEnd,
} from "@/lib/billing/stripe";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";
import { detectEntitlementDrift } from "@/lib/billing/entitlement-drift-detector";
import { billingLogger } from "@/lib/observability/structured-logger";
import { resolvePlanKey } from "@/lib/plans";

export interface BillingDiscrepancy {
  orgId: string;
  orgName?: string;
  discrepancyType:
    | "status_mismatch"
    | "plan_mismatch"
    | "period_end_mismatch"
    | "missing_stripe_subscription"
    | "orphaned_local_subscription"
    | "entitlement_drift";
  localValue: unknown;
  stripeValue: unknown;
  autoFixed: boolean;
  message: string;
}

export interface ReconciliationResult {
  checked: number;
  discrepancies: BillingDiscrepancy[];
  autoFixed: number;
  requiresManual: number;
  errors: string[];
  duration: number;
}

// v4-025: previously defaulted to TRUE (`!== "false"`) so a transient
// Stripe 5xx during a misconfigured cron run would silently downgrade
// active customers via shouldAutoCancelMissingStripe. Default to FALSE;
// operators opt in explicitly per environment by setting
// BILLING_AUTO_FIX=true.
const AUTO_FIX_ENABLED = process.env.BILLING_AUTO_FIX === "true";

// v4-025: cap concurrent Stripe `.retrieve` calls so a 500-org tenant
// load doesn't fan out 500 synchronous requests against Stripe and
// hit the 100 rps account limit. 5 is conservative — Stripe's rate
// limiter is well above this — but matches the per-account
// recommended concurrency for crons.
const STRIPE_CONCURRENCY = Number(process.env.BILLING_STRIPE_CONCURRENCY ?? 5);

// Status values that can be auto-corrected
const AUTO_FIX_STATUS_MAP: Record<string, string[]> = {
  active: ["trialing"], // Can fix trialing -> active if Stripe says active
  past_due: ["active"], // Can mark as past_due
  canceled: ["active", "past_due", "trialing"], // Can mark as canceled
};

export function shouldAutoCancelMissingStripe(localStatus: string | null): boolean {
  const normalized = (localStatus || "").toLowerCase();
  if (!normalized) return false;
  return normalized !== "active" && normalized !== "trialing";
}

export async function runBillingReconciliation(): Promise<ReconciliationResult> {
  const start = Date.now();
  const discrepancies: BillingDiscrepancy[] = [];
  const errors: string[] = [];
  let autoFixed = 0;

  billingLogger.info("reconciliation_started");

  const admin = createSupabaseAdminClient();
  const stripe = getStripeClient();

  if (!stripe) {
    billingLogger.warn("reconciliation_skipped", { reason: "stripe_not_configured" });
    return {
      checked: 0,
      discrepancies: [],
      autoFixed: 0,
      requiresManual: 0,
      errors: ["Stripe not configured"],
      duration: Date.now() - start,
    };
  }

  try {
    // Get all subscriptions with Stripe IDs
    const { data: subscriptions, error: subError } = await admin
      .from("org_subscriptions")
      .select(`
        organization_id,
        plan_key,
        status,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_end,
        organizations(name)
      `)
      .not("stripe_subscription_id", "is", null);

    if (subError) {
      errors.push(`Failed to fetch subscriptions: ${subError.message}`);
      return {
        checked: 0,
        discrepancies: [],
        autoFixed: 0,
        requiresManual: 0,
        errors,
        duration: Date.now() - start,
      };
    }

    const subs = subscriptions || [];

    // v4-025: process in concurrency-capped chunks instead of one
    // sub at a time. STRIPE_CONCURRENCY (default 5) bounds how
    // many in-flight Stripe `.retrieve` calls we hold — keeps us
    // well inside Stripe's per-account rate limits while
    // shortening total nightly-cron runtime on large tenants.
    const chunks: (typeof subs)[] = [];
    for (let i = 0; i < subs.length; i += STRIPE_CONCURRENCY) {
      chunks.push(subs.slice(i, i + STRIPE_CONCURRENCY));
    }

    const processSub = async (sub: (typeof subs)[number]) => {
      if (!sub.stripe_subscription_id) return;

      try {
        // Fetch from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const orgName = (sub.organizations as { name?: string } | null)?.name;

        // Check status match
        if (sub.status !== stripeSub.status) {
          const discrepancy: BillingDiscrepancy = {
            orgId: sub.organization_id,
            orgName,
            discrepancyType: "status_mismatch",
            localValue: sub.status,
            stripeValue: stripeSub.status,
            autoFixed: false,
            message: `Status mismatch: local=${sub.status}, stripe=${stripeSub.status}`,
          };

          // Attempt auto-fix
          if (AUTO_FIX_ENABLED && canAutoFixStatus(sub.status, stripeSub.status)) {
            const { error: updateError } = await admin
              .from("org_subscriptions")
              .update({
                status: stripeSub.status,
                updated_at: new Date().toISOString(),
              })
              .eq("organization_id", sub.organization_id);

            if (!updateError) {
              discrepancy.autoFixed = true;
              autoFixed++;
              billingLogger.info("auto_fixed_status", {
                orgId: sub.organization_id,
                from: sub.status,
                to: stripeSub.status,
              });
            }
          }

          discrepancies.push(discrepancy);
          await logReconciliationEvent(admin, sub.organization_id, discrepancy);
        }

        // Check plan match
        const stripePriceId = stripeSub.items.data[0]?.price?.id;
        const stripePlanKey = resolvePlanKeyFromPriceId(stripePriceId);
        const localPlanKey = resolvePlanKey(sub.plan_key);

        if (stripePlanKey && localPlanKey !== stripePlanKey) {
          const discrepancy: BillingDiscrepancy = {
            orgId: sub.organization_id,
            orgName,
            discrepancyType: "plan_mismatch",
            localValue: localPlanKey,
            stripeValue: stripePlanKey,
            autoFixed: false,
            message: `Plan mismatch: local=${localPlanKey}, stripe=${stripePlanKey}`,
          };

          // Auto-fix plan and entitlements
          if (AUTO_FIX_ENABLED) {
            const { error: updateError } = await admin
              .from("org_subscriptions")
              .update({
                plan_key: stripePlanKey,
                price_id: stripePriceId,
                updated_at: new Date().toISOString(),
              })
              .eq("organization_id", sub.organization_id);

            if (!updateError) {
              await syncEntitlementsForPlan(sub.organization_id, stripePlanKey);
              discrepancy.autoFixed = true;
              autoFixed++;
              billingLogger.info("auto_fixed_plan", {
                orgId: sub.organization_id,
                from: localPlanKey,
                to: stripePlanKey,
              });
            }
          }

          discrepancies.push(discrepancy);
          await logReconciliationEvent(admin, sub.organization_id, discrepancy);
        }

        // Check entitlement_drift — the discrepancyType union has listed
        // this since v4-018 but no code path in reconciliation ever
        // emitted it. Local plan_key and Stripe plan_key can be in
        // sync, yet the org's org_entitlements rows can be in any
        // state: half-applied syncEntitlementsForPlan, manual SQL fix,
        // disableEntitlementsForOrg from a now-resurrected sub.
        //
        // Reuse the existing detectEntitlementDrift module (already
        // unit-tested) — passing AUTO_FIX_ENABLED gates self-healing
        // through the same env flag as the rest of the reconciler.
        try {
          const drift = await detectEntitlementDrift(
            sub.organization_id,
            AUTO_FIX_ENABLED,
          );
          if (drift.hasDrift) {
            const discrepancy: BillingDiscrepancy = {
              orgId: sub.organization_id,
              orgName,
              discrepancyType: "entitlement_drift",
              localValue: drift.actual,
              stripeValue: drift.expected,
              autoFixed: drift.autoFixed,
              message: `Entitlement drift: ${drift.corrections.length} corrections (${drift.corrections
                .map((c) => `${c.type}:${c.featureKey}`)
                .join(", ")})`,
            };
            if (drift.autoFixed) autoFixed++;
            discrepancies.push(discrepancy);
            await logReconciliationEvent(admin, sub.organization_id, discrepancy);
          }
        } catch (driftErr) {
          billingLogger.warn("entitlement_drift_check_failed", {
            orgId: sub.organization_id,
            error: driftErr instanceof Error ? driftErr.message : String(driftErr),
          });
        }

        // Check period end match (allow 1 day tolerance)
        const periodEndUnix = subscriptionPeriodEnd(stripeSub);
        if (periodEndUnix) {
          const stripeEndMs = periodEndUnix * 1000;
          const localEndMs = sub.current_period_end
            ? new Date(sub.current_period_end).getTime()
            : 0;
          const diffDays = Math.abs(stripeEndMs - localEndMs) / (1000 * 60 * 60 * 24);

          if (diffDays > 1) {
            const newPeriodEnd = new Date(stripeEndMs).toISOString();
            const discrepancy: BillingDiscrepancy = {
              orgId: sub.organization_id,
              orgName,
              discrepancyType: "period_end_mismatch",
              localValue: sub.current_period_end,
              stripeValue: newPeriodEnd,
              autoFixed: false,
              message: `Period end mismatch: ${diffDays.toFixed(1)} days difference`,
            };

            if (AUTO_FIX_ENABLED) {
              const { error: updateError } = await admin
                .from("org_subscriptions")
                .update({
                  current_period_end: newPeriodEnd,
                  updated_at: new Date().toISOString(),
                })
                .eq("organization_id", sub.organization_id);

              if (!updateError) {
                discrepancy.autoFixed = true;
                autoFixed++;
              }
            }

            discrepancies.push(discrepancy);
            await logReconciliationEvent(admin, sub.organization_id, discrepancy);
          }
        }
      } catch (stripeError) {
        const err = stripeError as Error & { code?: string };

        // Handle deleted/missing Stripe subscriptions
        if (err.code === "resource_missing") {
          const discrepancy: BillingDiscrepancy = {
            orgId: sub.organization_id,
            orgName: (sub.organizations as { name?: string } | null)?.name,
            discrepancyType: "missing_stripe_subscription",
            localValue: sub.stripe_subscription_id,
            stripeValue: null,
            autoFixed: false,
            message: `Stripe subscription ${sub.stripe_subscription_id} not found`,
          };

          // Mark as canceled if subscription doesn't exist in Stripe
          if (
            AUTO_FIX_ENABLED &&
            sub.status !== "canceled" &&
            shouldAutoCancelMissingStripe(sub.status)
          ) {
            const { error: updateError } = await admin
              .from("org_subscriptions")
              .update({
                status: "canceled",
                updated_at: new Date().toISOString(),
              })
              .eq("organization_id", sub.organization_id);

            if (!updateError) {
              discrepancy.autoFixed = true;
              autoFixed++;
            }
          }

          discrepancies.push(discrepancy);
          await logReconciliationEvent(admin, sub.organization_id, discrepancy);
        } else {
          errors.push(`Error checking ${sub.organization_id}: ${err.message}`);
        }
      }
    };

    for (const chunk of chunks) {
      await Promise.all(chunk.map(processSub));
    }

    billingLogger.info("reconciliation_completed", {
      checked: subs.length,
      discrepancies: discrepancies.length,
      autoFixed,
      duration: Date.now() - start,
    });

    return {
      checked: subs.length,
      discrepancies,
      autoFixed,
      requiresManual: discrepancies.filter(d => !d.autoFixed).length,
      errors,
      duration: Date.now() - start,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    billingLogger.error("reconciliation_failed", err);
    errors.push(err.message);

    return {
      checked: 0,
      discrepancies: [],
      autoFixed: 0,
      requiresManual: 0,
      errors,
      duration: Date.now() - start,
    };
  }
}

function canAutoFixStatus(localStatus: string | null, stripeStatus: string): boolean {
  if (!localStatus) return true;
  const allowedFromStatuses = AUTO_FIX_STATUS_MAP[stripeStatus];
  return allowedFromStatuses?.includes(localStatus) ?? false;
}

async function logReconciliationEvent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  discrepancy: BillingDiscrepancy
): Promise<void> {
  try {
    // Try to insert into billing_reconciliation_log
    await admin.from("billing_reconciliation_log").insert({
      organization_id: orgId,
      discrepancy_type: discrepancy.discrepancyType,
      local_value: discrepancy.localValue as Record<string, unknown>,
      stripe_value: discrepancy.stripeValue as Record<string, unknown>,
      auto_fixed: discrepancy.autoFixed,
      fixed_at: discrepancy.autoFixed ? new Date().toISOString() : null,
    }).then(({ error }: { error: { message: string } | null }) => {
      // Ignore if table doesn't exist yet
      if (error && !error.message.includes("does not exist")) {
        billingLogger.warn("reconciliation_log_insert_error", { error: error.message });
      }
    });
  } catch {
    // Silent fail - table may not exist yet
  }
}
