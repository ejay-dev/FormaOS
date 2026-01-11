"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";
import { ensureSubscription } from "@/lib/billing/subscriptions";
import { getStripeClient, resolvePlanKeyFromPriceId } from "@/lib/billing/stripe";
import { requireFounderAccess } from "@/app/app/admin/access";

export async function updateOrgPlan(formData: FormData) {
  await requireFounderAccess();
  const orgId = String(formData.get("orgId") ?? "");
  const planRaw = String(formData.get("plan") ?? "");
  const plan = resolvePlanKey(planRaw);

  if (!orgId || !plan) {
    throw new Error("Invalid request");
  }

  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();

  await admin
    .from("organizations")
    .update({ plan_key: plan, plan_selected_at: now })
    .eq("id", orgId);

  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("status")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (subscription?.status) {
    await admin
      .from("org_subscriptions")
      .update({ plan_key: plan, updated_at: now })
      .eq("organization_id", orgId);
  } else {
    await ensureSubscription(orgId, plan);
  }

  if (plan === "basic" || plan === "pro") {
    await syncEntitlementsForPlan(orgId, plan);
  }
}

export async function extendTrial(formData: FormData) {
  await requireFounderAccess();
  const orgId = String(formData.get("orgId") ?? "");
  const daysRaw = Number(formData.get("days") ?? 0);
  const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(90, daysRaw)) : 14;

  if (!orgId) {
    throw new Error("Invalid request");
  }

  const admin = createSupabaseAdminClient();
  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("current_period_end, plan_key")
    .eq("organization_id", orgId)
    .maybeSingle();

  const base = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : new Date();
  const now = new Date();
  const effectiveStart = base > now ? base : now;
  const nextEnd = new Date(effectiveStart.getTime() + days * 24 * 60 * 60 * 1000);

  await admin
    .from("org_subscriptions")
    .upsert({
      organization_id: orgId,
      plan_key: subscription?.plan_key ?? null,
      status: "trialing",
      current_period_end: nextEnd.toISOString(),
      updated_at: now.toISOString(),
    });
}

export async function setOrgStatus(formData: FormData) {
  await requireFounderAccess();
  const orgId = String(formData.get("orgId") ?? "");
  const action = String(formData.get("action") ?? "");

  if (!orgId || !["block", "unblock"].includes(action)) {
    throw new Error("Invalid request");
  }

  const admin = createSupabaseAdminClient();
  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("status, current_period_end, stripe_subscription_id")
    .eq("organization_id", orgId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  if (action === "block") {
    await admin
      .from("org_subscriptions")
      .upsert({
        organization_id: orgId,
        status: "blocked",
        updated_at: nowIso,
      });
    return;
  }

  const hasStripeSub = Boolean(subscription?.stripe_subscription_id);
  const hasTrialEnd = Boolean(subscription?.current_period_end);
  const trialActive = hasTrialEnd
    ? new Date(subscription?.current_period_end as string).getTime() > Date.now()
    : false;
  const status = hasStripeSub ? "active" : trialActive ? "trialing" : "pending";

  await admin
    .from("org_subscriptions")
    .update({ status, updated_at: nowIso })
    .eq("organization_id", orgId);
}

export async function resyncStripeSubscription(formData: FormData) {
  await requireFounderAccess();
  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) {
    throw new Error("Invalid request");
  }

  const admin = createSupabaseAdminClient();
  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No Stripe subscription to resync");
  }

  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
  const stripeStatus = stripeSub.status === "canceled" ? "cancelled" : stripeSub.status;
  const priceId = stripeSub.items.data[0]?.price?.id ?? null;
  const planKey = resolvePlanKeyFromPriceId(priceId);
  const currentPeriodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000).toISOString()
    : null;

  const updatePayload: Record<string, string | null> = {
    status: stripeStatus,
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };
  if (planKey) {
    updatePayload.plan_key = planKey;
  }

  await admin.from("org_subscriptions").update(updatePayload).eq("organization_id", orgId);

  if (planKey) {
    await admin.from("organizations").update({ plan_key: planKey }).eq("id", orgId);
  }
}
