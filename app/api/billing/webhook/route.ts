import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import {
  getStripeClient,
  resolvePlanKeyFromPriceId,
} from '@/lib/billing/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing webhook configuration' },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 },
    );
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature error:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Idempotency: persist the Stripe event id before side effects.
  // If it already exists, we treat this delivery as a duplicate and no-op.
  const { error: insertEventError } = await admin.from('billing_events').insert({
    id: event.id,
    event_type: event.type,
  });

  if (insertEventError) {
    if (insertEventError.code === '23505') {
      return NextResponse.json({ received: true });
    }
    console.error(
      '[billing/webhook] billing_events insert failed:',
      insertEventError.message,
    );
    return NextResponse.json(
      { error: 'Webhook persistence failed' },
      { status: 500 },
    );
  }

  try {
    const upsertFromSubscription = async (
      subscription: Stripe.Subscription,
    ) => {
      const customerId = subscription.customer as string | null;
      const subscriptionId = subscription.id;
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const planKey =
        resolvePlanKey(subscription.metadata?.plan_key ?? null) ??
        resolvePlanKeyFromPriceId(priceId);
      const orgId = subscription.metadata?.organization_id ?? null;

      const matchColumn = orgId ? 'organization_id' : 'stripe_subscription_id';
      const matchValue = orgId ?? subscriptionId;

      const { data: row } = await admin
        .from('org_subscriptions')
        .select('organization_id')
        .eq(matchColumn, matchValue)
        .maybeSingle();

      if (!row?.organization_id && !orgId) {
        const { data: byCustomer } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!byCustomer?.organization_id) return null;
      }

      const targetOrgId = row?.organization_id ?? orgId;
      if (!targetOrgId || !planKey) return null;

      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const trialExpiresAt =
        subscription.status === 'trialing' ? currentPeriodEnd : null;

      const { error: subUpsertErr } = await admin
        .from('org_subscriptions')
        .upsert({
          organization_id: targetOrgId,
          plan_key: planKey,
          status: subscription.status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          current_period_end: currentPeriodEnd,
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          trial_started_at:
            subscription.status === 'trialing'
              ? new Date().toISOString()
              : null,
          trial_expires_at: trialExpiresAt,
          updated_at: new Date().toISOString(),
        });
      if (subUpsertErr) {
        console.error(
          '[billing/webhook] org_subscriptions upsert failed:',
          subUpsertErr.message,
        );
        throw subUpsertErr;
      }

      const { error: orgUpdateErr } = await admin
        .from('organizations')
        .update({ plan_key: planKey })
        .eq('id', targetOrgId);
      if (orgUpdateErr) {
        console.error(
          '[billing/webhook] organizations plan_key update failed:',
          orgUpdateErr.message,
        );
        throw orgUpdateErr;
      }

      await syncEntitlementsForPlan(targetOrgId, planKey);
      return targetOrgId;
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organization_id;
      const planKey = resolvePlanKey(session.metadata?.plan_key ?? null);
      const subscriptionId = session.subscription as string | null;
      const customerId = session.customer as string | null;
      let priceId = session.metadata?.price_id ?? null;
      let status = 'active';
      let currentPeriodEnd: string | null = null;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        status = subscription.status;
        priceId = subscription.items.data[0]?.price?.id ?? priceId;
        currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
      }

      if (orgId && planKey) {
        const trialExpiresAt = status === 'trialing' ? currentPeriodEnd : null;
        const { error: checkoutSubErr } = await admin
          .from('org_subscriptions')
          .upsert({
            organization_id: orgId,
            plan_key: planKey,
            status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            price_id: priceId,
            current_period_end: currentPeriodEnd,
            trial_started_at:
              status === 'trialing' ? new Date().toISOString() : null,
            trial_expires_at: trialExpiresAt,
            updated_at: new Date().toISOString(),
          });
        if (checkoutSubErr) {
          console.error(
            '[billing/webhook] checkout org_subscriptions upsert failed:',
            checkoutSubErr.message,
          );
          throw checkoutSubErr;
        }

        const { error: checkoutOrgErr } = await admin
          .from('organizations')
          .update({ plan_key: planKey })
          .eq('id', orgId);
        if (checkoutOrgErr) {
          console.error(
            '[billing/webhook] checkout organizations plan_key update failed:',
            checkoutOrgErr.message,
          );
          throw checkoutOrgErr;
        }

        await syncEntitlementsForPlan(orgId, planKey);
      }
    }

    if (event.type === 'customer.subscription.created') {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
    }

    if (event.type === 'customer.subscription.updated') {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const { error: cancelErr } = await admin
        .from('org_subscriptions')
        .update({
          status: 'canceled',
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);
      if (cancelErr) {
        console.error(
          '[billing/webhook] subscription cancellation update failed:',
          cancelErr.message,
        );
        throw cancelErr;
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      const customerId = invoice.customer as string | null;

      if (subscriptionId || customerId) {
        const { error: paidErr } = await admin
          .from('org_subscriptions')
          .update({
            status: 'active',
            trial_started_at: null,
            trial_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .match(
            subscriptionId
              ? { stripe_subscription_id: subscriptionId }
              : { stripe_customer_id: customerId },
          );
        if (paidErr) {
          console.error(
            '[billing/webhook] invoice.paid update failed:',
            paidErr.message,
          );
          throw paidErr;
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      const customerId = invoice.customer as string | null;

      if (subscriptionId || customerId) {
        const { error: failedErr } = await admin
          .from('org_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .match(
            subscriptionId
              ? { stripe_subscription_id: subscriptionId }
              : { stripe_customer_id: customerId },
          );
        if (failedErr) {
          console.error(
            '[billing/webhook] invoice.payment_failed update failed:',
            failedErr.message,
          );
          throw failedErr;
        }
      }
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
