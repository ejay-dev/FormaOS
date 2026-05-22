import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  getStripeClient,
  resolvePlanKeyFromPriceId,
} from '@/lib/billing/stripe';

const log = routeLog('/api/billing/webhook');
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PLAN_CATALOG, resolvePlanKey } from '@/lib/plans';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';
import { sendBillingEmail } from '@/lib/email/billing-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    log.error({ err: error }, 'Stripe webhook signature error:');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Track orgs whose subscription cache needs to be invalidated after the
  // webhook side effects land. The /app billing gate reads this cache (5-min
  // unstable_cache TTL); without invalidation a paid user could be stuck on
  // /app/billing for several minutes after Stripe confirms payment.
  const orgsToRevalidate = new Set<string>();

  // Idempotency state machine.
  //
  // We CANNOT short-circuit on a unique-constraint violation alone, because
  // the previous attempt may have failed mid-way through side effects. Stripe
  // will retry; we have to re-run those side effects. The contract:
  //
  //   1. Try to atomically claim the event (insert pending OR update an
  //      existing pending/failed row to claim a new attempt).
  //   2. If the row is already 'succeeded', return 200 — true no-op.
  //   3. If we claim it, proceed; on success mark 'succeeded'; on throw mark
  //      'failed' so Stripe's retry will reclaim it next delivery.
  const startedAt = new Date().toISOString();

  const { error: insertEventError } = await admin
    .from('billing_events')
    .insert({
      id: event.id,
      event_type: event.type,
      status: 'pending',
      attempts: 1,
      started_at: startedAt,
    });

  let claimed = !insertEventError;

  if (insertEventError) {
    if (insertEventError.code === '23505') {
      const { data: existing } = await admin
        .from('billing_events')
        .select('status, attempts')
        .eq('id', event.id)
        .maybeSingle();

      if (existing?.status === 'succeeded') {
        return NextResponse.json({ received: true, idempotent: true });
      }

      // pending or failed → claim a new attempt and proceed.
      const { error: claimErr } = await admin
        .from('billing_events')
        .update({
          status: 'pending',
          attempts: (existing?.attempts ?? 0) + 1,
          started_at: startedAt,
          last_error: null,
        })
        .eq('id', event.id);

      if (claimErr) {
        log.error(
          { err: claimErr.message },
          '[billing/webhook] failed to claim billing_events row for retry',
        );
        return NextResponse.json(
          { error: 'Webhook claim failed' },
          { status: 500 },
        );
      }

      claimed = true;
    } else {
      log.error(
        { err: insertEventError.message },
        '[billing/webhook] billing_events insert failed:',
      );
      return NextResponse.json(
        { error: 'Webhook persistence failed' },
        { status: 500 },
      );
    }
  }

  if (!claimed) {
    // Defensive — should be unreachable.
    return NextResponse.json(
      { error: 'Webhook claim indeterminate' },
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
        .select('organization_id, stripe_customer_id, stripe_subscription_id')
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

      // Audit isolation-004 (2026-05-22): when the row already binds a
      // different Stripe customer or subscription, refuse to silently
      // overwrite. An attacker who can stamp metadata.organization_id on
      // a webhook-signed subscription (own Stripe account, test-mode
      // events, replays) could rebind the victim org's billing to
      // attacker-controlled IDs — silent entitlement / trial transfer.
      const existingCustomer = row?.stripe_customer_id as string | null | undefined;
      const existingSubscription = row?.stripe_subscription_id as string | null | undefined;
      const customerDrift =
        existingCustomer && customerId && existingCustomer !== customerId;
      const subscriptionDrift =
        existingSubscription &&
        subscriptionId &&
        existingSubscription !== subscriptionId;
      if (customerDrift || subscriptionDrift) {
        log.error(
          {
            orgId: targetOrgId,
            existingCustomer,
            incomingCustomer: customerId,
            existingSubscription,
            incomingSubscription: subscriptionId,
            eventId: event.id,
          },
          '[billing/webhook] stripe identifier drift — refusing upsert',
        );
        // Best-effort drift record. The table may not exist in this env;
        // when missing, the log line above is the audit trail.
        await admin
          .from('billing_reconciliation_log')
          .insert({
            organization_id: targetOrgId,
            event_id: event.id,
            event_type: event.type,
            expected_customer_id: existingCustomer ?? null,
            actual_customer_id: customerId,
            expected_subscription_id: existingSubscription ?? null,
            actual_subscription_id: subscriptionId,
            reason: customerDrift ? 'customer_id_drift' : 'subscription_id_drift',
            created_at: new Date().toISOString(),
          })
          .then(({ error: insertErr }) => {
            if (insertErr) {
              log.warn(
                { err: insertErr.message },
                '[billing/webhook] billing_reconciliation_log insert failed (table may not exist)',
              );
            }
          });
        // Return null so the caller treats this as a non-actionable event
        // (status code stays 200 to Stripe so retries don't pile up).
        return null;
      }

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
        log.error(
          { err: subUpsertErr.message },
          '[billing/webhook] org_subscriptions upsert failed:',
        );
        throw subUpsertErr;
      }

      const { error: orgUpdateErr } = await admin
        .from('organizations')
        .update({ plan_key: planKey })
        .eq('id', targetOrgId);
      if (orgUpdateErr) {
        log.error(
          { err: orgUpdateErr.message },
          '[billing/webhook] organizations plan_key update failed:',
        );
        throw orgUpdateErr;
      }

      await syncEntitlementsForPlan(targetOrgId, planKey);
      orgsToRevalidate.add(targetOrgId);
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
          log.error(
            { err: checkoutSubErr.message },
            '[billing/webhook] checkout org_subscriptions upsert failed:',
          );
          throw checkoutSubErr;
        }

        const { error: checkoutOrgErr } = await admin
          .from('organizations')
          .update({ plan_key: planKey })
          .eq('id', orgId);
        if (checkoutOrgErr) {
          log.error(
            { err: checkoutOrgErr.message },
            '[billing/webhook] checkout organizations plan_key update failed:',
          );
          throw checkoutOrgErr;
        }

        await syncEntitlementsForPlan(orgId, planKey);
        orgsToRevalidate.add(orgId);
      }
    }

    if (event.type === 'customer.subscription.created') {
      const orgId = await upsertFromSubscription(
        event.data.object as Stripe.Subscription,
      );
      if (orgId) {
        await sendBillingEmail(admin, orgId, 'subscription_created');
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = (
        event.data as { previous_attributes?: Record<string, unknown> }
      ).previous_attributes;
      await upsertFromSubscription(subscription);

      // Determine if upgrade or downgrade
      const orgId = subscription.metadata?.organization_id ?? null;
      if (orgId && previousAttributes?.items) {
        const newPlanKey = resolvePlanKeyFromPriceId(
          subscription.items.data[0]?.price?.id ?? null,
        );
        if (newPlanKey) {
          const planConfig = PLAN_CATALOG[newPlanKey];
          await sendBillingEmail(admin, orgId, 'plan_changed', {
            planName: planConfig.name,
            planKey: newPlanKey,
          });
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const { data: subRow } = await admin
        .from('org_subscriptions')
        .select('organization_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      const { error: cancelErr } = await admin
        .from('org_subscriptions')
        .update({
          status: 'canceled',
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);
      if (cancelErr) {
        log.error(
          { err: cancelErr.message },
          '[billing/webhook] subscription cancellation update failed:',
        );
        throw cancelErr;
      }

      // Send cancellation email
      if (subRow?.organization_id) {
        await sendBillingEmail(
          admin,
          subRow.organization_id,
          'subscription_cancelled',
        );
        orgsToRevalidate.add(subRow.organization_id);
      }
    }

    if (event.type === 'customer.subscription.trial_will_end') {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.organization_id ?? null;
      const subscriptionId = subscription.id;

      const resolvedOrgId =
        orgId ??
        (
          await admin
            .from('org_subscriptions')
            .select('organization_id')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle()
        ).data?.organization_id;

      if (resolvedOrgId) {
        await sendBillingEmail(admin, resolvedOrgId, 'trial_expiring');
      }
    }

    if (event.type === 'customer.created') {
      const customer = event.data.object as Stripe.Customer;
      const orgId = customer.metadata?.organization_id ?? null;

      if (orgId) {
        const { error: customerErr } = await admin
          .from('org_subscriptions')
          .update({
            stripe_customer_id: customer.id,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId);
        if (customerErr) {
          log.error(
            { err: customerErr.message },
            '[billing/webhook] customer.created update failed:',
          );
        }
      }
    }

    if (event.type === 'invoice.payment_action_required') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string | null;

      if (customerId) {
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subRow?.organization_id) {
          await sendBillingEmail(
            admin,
            subRow.organization_id,
            'payment_action_required',
          );
        }
      }
    }

    if (
      event.type === 'invoice.paid' ||
      event.type === 'invoice.payment_succeeded'
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      const customerId = invoice.customer as string | null;

      if (subscriptionId || customerId) {
        // Check if this was a recovery from past_due
        const matchCol = subscriptionId
          ? { stripe_subscription_id: subscriptionId }
          : { stripe_customer_id: customerId };

        const { data: existingRow } = await admin
          .from('org_subscriptions')
          .select('organization_id, status')
          .match(matchCol)
          .maybeSingle();

        const wasPastDue = existingRow?.status === 'past_due';

        // Core update fields (always present in schema)
        const updatePayload: Record<string, unknown> = {
          status: 'active',
          trial_started_at: null,
          trial_expires_at: null,
          updated_at: new Date().toISOString(),
        };

        // Try with payment_failed_at first, fall back without it
        let paidErr: { message: string } | null = null;
        const { error: fullErr } = await admin
          .from('org_subscriptions')
          .update({ ...updatePayload, payment_failed_at: null })
          .match(matchCol);
        if (fullErr && fullErr.message.includes('payment_failed_at')) {
          // Column doesn't exist yet — update without it
          const { error: fallbackErr } = await admin
            .from('org_subscriptions')
            .update(updatePayload)
            .match(matchCol);
          paidErr = fallbackErr;
        } else {
          paidErr = fullErr;
        }
        if (paidErr) {
          log.error(
            { err: paidErr.message },
            '[billing/webhook] invoice.paid update failed:',
          );
          throw paidErr;
        }

        // Send payment recovered email if previously failing
        if (wasPastDue && existingRow?.organization_id) {
          await sendBillingEmail(
            admin,
            existingRow.organization_id,
            'payment_recovered',
          );
        }
        if (existingRow?.organization_id) {
          orgsToRevalidate.add(existingRow.organization_id);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      const customerId = invoice.customer as string | null;

      if (subscriptionId || customerId) {
        const matchCol = subscriptionId
          ? { stripe_subscription_id: subscriptionId }
          : { stripe_customer_id: customerId };

        // Core update fields
        const failedPayload: Record<string, unknown> = {
          status: 'past_due',
          updated_at: new Date().toISOString(),
        };

        // Try with payment_failed_at first, fall back without it
        let failedErr: { message: string } | null = null;
        const { error: fullFailedErr } = await admin
          .from('org_subscriptions')
          .update({
            ...failedPayload,
            payment_failed_at: new Date().toISOString(),
          })
          .match(matchCol);
        if (
          fullFailedErr &&
          fullFailedErr.message.includes('payment_failed_at')
        ) {
          const { error: fallbackErr } = await admin
            .from('org_subscriptions')
            .update(failedPayload)
            .match(matchCol);
          failedErr = fallbackErr;
        } else {
          failedErr = fullFailedErr;
        }
        if (failedErr) {
          log.error(
            { err: failedErr.message },
            '[billing/webhook] invoice.payment_failed update failed:',
          );
          throw failedErr;
        }

        // Find org to send notification email
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .match(matchCol)
          .maybeSingle();

        if (subRow?.organization_id) {
          await sendBillingEmail(
            admin,
            subRow.organization_id,
            'payment_failed',
          );
          orgsToRevalidate.add(subRow.organization_id);
        }
      }
    }

    // -----------------------------------------------------------------
    // Audit billing-005 (2026-05-22): the webhook previously had no
    // handler for `charge.refunded` or `charge.dispute.*` even though
    // the admin console exposes a refund endpoint and disputes happen
    // organically. Refunds left org_subscriptions.status untouched
    // (so internal revenue reporting + customer-health signal stayed
    // wrong) and disputes never paused entitlements.
    // -----------------------------------------------------------------
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const customerId =
        typeof charge.customer === 'string' ? charge.customer : null;
      if (customerId) {
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (subRow?.organization_id) {
          const refundedAmount = charge.amount_refunded ?? 0;
          const fullyRefunded = charge.refunded === true;
          await admin.from('billing_events_audit').insert({
            organization_id: subRow.organization_id,
            event_id: event.id,
            event_type: event.type,
            stripe_customer_id: customerId,
            stripe_charge_id: charge.id,
            amount: refundedAmount,
            currency: charge.currency ?? null,
            payload: {
              fully_refunded: fullyRefunded,
              refund_reason: charge.refunds?.data?.[0]?.reason ?? null,
            },
            created_at: new Date().toISOString(),
          }).then(({ error: insertErr }) => {
            if (insertErr) {
              // Audit row is best-effort — log and continue. The org-level
              // status change is the load-bearing piece.
              log.warn(
                { err: insertErr.message, eventId: event.id },
                '[billing/webhook] charge.refunded audit row insert failed',
              );
            }
          });
          orgsToRevalidate.add(subRow.organization_id);
        }
      }
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const customerId =
        typeof dispute.charge === 'object' && dispute.charge?.customer
          ? (typeof dispute.charge.customer === 'string'
              ? dispute.charge.customer
              : dispute.charge.customer.id)
          : null;
      if (customerId) {
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (subRow?.organization_id) {
          // Flag the org so entitlements can be paused by ops until the
          // dispute is resolved. We don't auto-cancel — that's an ops
          // judgement call.
          await admin
            .from('org_subscriptions')
            .update({
              dispute_open: true,
              dispute_opened_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', subRow.organization_id)
            .then(({ error: updateErr }) => {
              if (updateErr && /column.*dispute/.test(updateErr.message)) {
                // dispute_open / dispute_opened_at columns may not exist
                // yet (added in a follow-up migration). Log and continue
                // so the audit row + ops notification still land.
                log.warn(
                  { err: updateErr.message },
                  '[billing/webhook] dispute_open column not yet migrated',
                );
              } else if (updateErr) {
                log.error(
                  { err: updateErr.message, eventId: event.id },
                  '[billing/webhook] charge.dispute.created update failed',
                );
                throw updateErr;
              }
            });
          orgsToRevalidate.add(subRow.organization_id);
        }
      }
    }

    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const customerId =
        typeof dispute.charge === 'object' && dispute.charge?.customer
          ? (typeof dispute.charge.customer === 'string'
              ? dispute.charge.customer
              : dispute.charge.customer.id)
          : null;
      if (customerId) {
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (subRow?.organization_id) {
          await admin
            .from('org_subscriptions')
            .update({
              dispute_open: false,
              dispute_closed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', subRow.organization_id)
            .then(({ error: updateErr }) => {
              if (updateErr && /column.*dispute/.test(updateErr.message)) {
                log.warn(
                  { err: updateErr.message },
                  '[billing/webhook] dispute_open column not yet migrated',
                );
              }
            });
          orgsToRevalidate.add(subRow.organization_id);
        }
      }
    }
  } catch (error) {
    log.error({ err: error }, 'Stripe webhook processing error:');

    // Mark this attempt failed so Stripe's retry will reclaim and re-run
    // side effects. Without this the next delivery would see status='pending'
    // and treat the row as in-flight.
    const message = error instanceof Error ? error.message : String(error);
    const { error: failErr } = await admin
      .from('billing_events')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: message.slice(0, 1000),
      })
      .eq('id', event.id);
    if (failErr) {
      log.error(
        { err: failErr.message },
        '[billing/webhook] failed to mark billing_events row as failed',
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }

  // Bust the cached /app layout + /app/billing so the billing-gate read lands
  // on fresh subscription data immediately — without this, paid users could
  // be stuck on /app/billing for up to 5 minutes (unstable_cache TTL) after
  // their payment is confirmed by Stripe.
  if (orgsToRevalidate.size > 0) {
    revalidatePath('/app', 'layout');
    revalidatePath('/app/billing');
  }

  // Side effects landed — mark the event row succeeded so Stripe retries
  // (which would carry the same event.id) become true no-ops.
  const { error: doneErr } = await admin
    .from('billing_events')
    .update({
      status: 'succeeded',
      completed_at: new Date().toISOString(),
    })
    .eq('id', event.id);
  if (doneErr) {
    // The side effects already ran; we just couldn't update the marker.
    // Stripe retrying would be safe (would re-run idempotent upserts).
    log.error(
      { err: doneErr.message },
      '[billing/webhook] failed to mark billing_events row succeeded',
    );
  }

  return NextResponse.json({ received: true });
}
