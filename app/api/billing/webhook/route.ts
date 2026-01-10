import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: existingEvent } = await admin
    .from("billing_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent?.id) {
    return NextResponse.json({ received: true });
  }

  await admin.from("billing_events").insert({ id: event.id, event_type: event.type });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;
      const planKey = resolvePlanKey(session.metadata?.plan_key ?? null);
      const subscriptionId = session.subscription as string | null;
      const customerId = session.customer as string | null;

      if (orgId && planKey) {
        await admin
          .from("org_subscriptions")
          .upsert({
            organization_id: orgId,
            plan_key: planKey,
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          });

        await admin
          .from("organizations")
          .update({ plan_key: planKey })
          .eq("id", orgId);

        await syncEntitlementsForPlan(orgId, planKey);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string | null;
      const subscriptionId = subscription.id;

      const { data: row } = await admin
        .from("org_subscriptions")
        .select("organization_id, plan_key")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (row?.organization_id) {
        const status = subscription.status;
        await admin
          .from("org_subscriptions")
          .update({
            status,
            stripe_customer_id: customerId,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", row.organization_id);

        const planKey = resolvePlanKey(row.plan_key);
        if (planKey) {
          await syncEntitlementsForPlan(row.organization_id, planKey);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const { data: row } = await admin
        .from("org_subscriptions")
        .select("organization_id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (row?.organization_id) {
        await admin
          .from("org_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", row.organization_id);
      }
    }
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
