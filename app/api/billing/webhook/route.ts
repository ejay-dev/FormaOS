import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
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
import {
  disableEntitlementsForOrg,
  syncEntitlementsForPlan,
} from '@/lib/billing/entitlements';
import { sendBillingEmail } from '@/lib/email/billing-emails';
import { captureRouteError } from '@/lib/observability/with-route-observability';

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
    // v4-022: previously log-only. A signature-mismatch spike is
    // either (a) a webhook-secret rotation that left prod out of
    // sync — silent paid-cancellation breakage — or (b) an active
    // forgery attempt. Both deserve a Sentry alert, which the
    // billing-webhook-error-spike rule named in RUNBOOKS already
    // expects.
    log.error({ err: error }, 'Stripe webhook signature error:');
    Sentry.captureException(error, {
      tags: {
        component: 'billing.webhook',
        operation: 'constructEvent',
      },
      level: 'error',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Track orgs whose subscription cache needs to be invalidated after the
  // webhook side effects land. The /app billing gate reads this cache (5-min
  // unstable_cache TTL); without invalidation a paid user could be stuck on
  // /app/billing for several minutes after Stripe confirms payment.
  const orgsToRevalidate = new Set<string>();

  /**
   * Audit v3-014 (2026-05-22): write to billing_events_audit for every
   * state-mutating event branch. PR #119 created the table for the
   * charge.refunded handler, but subscription cancel / dispute /
   * payment failure / plan change events all bypassed it — incomplete
   * audit trail for ops + customer-health pipelines.
   *
   * Best-effort: never throws. The unique (event_id, event_type) index
   * makes retries idempotent. Logs and continues on failure so the
   * webhook still 200s to Stripe.
   */
  async function writeBillingAudit(args: {
    organizationId: string;
    stripeCustomerId?: string | null;
    stripeChargeId?: string | null;
    amount?: number | null;
    currency?: string | null;
    payload?: Record<string, unknown>;
  }) {
    const { error: auditErr } = await admin
      .from('billing_events_audit')
      .insert({
        organization_id: args.organizationId,
        event_id: event.id,
        event_type: event.type,
        stripe_customer_id: args.stripeCustomerId ?? null,
        stripe_charge_id: args.stripeChargeId ?? null,
        amount: args.amount ?? null,
        currency: args.currency ?? null,
        payload: args.payload ?? {},
        created_at: new Date().toISOString(),
      });
    if (auditErr && auditErr.code !== '23505' /* unique conflict, harmless retry */) {
      log.warn(
        { err: auditErr.message, eventId: event.id, eventType: event.type },
        '[billing/webhook] billing_events_audit insert failed',
      );
    }
  }

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

      // v4-025: only reclaim a `pending` row when the previous
      // attempt has stalled (started_at older than the 5-minute
      // Stripe redelivery cutoff). Otherwise two concurrent
      // webhook deliveries would both proceed past the claim and
      // produce duplicate side effects. Stripe will retry on its
      // own schedule; returning 200 here just defers to that.
      const FIVE_MINUTES_AGO = new Date(
        Date.now() - 5 * 60 * 1000,
      ).toISOString();
      const { data: claimed_rows, error: claimErr } = await admin
        .from('billing_events')
        .update({
          status: 'pending',
          attempts: (existing?.attempts ?? 0) + 1,
          started_at: startedAt,
          last_error: null,
        })
        .eq('id', event.id)
        .or(`status.neq.pending,started_at.lt.${FIVE_MINUTES_AGO}`)
        .select('id');

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

      if (!claimed_rows?.length) {
        // Another delivery is actively processing this event. Drop
        // ours; Stripe will redeliver if the active one fails.
        return NextResponse.json({
          received: true,
          concurrent_processing: true,
        });
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

      type OrgSubRow = {
        organization_id: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
      };
      const initial = await admin
        .from('org_subscriptions')
        .select('organization_id, stripe_customer_id, stripe_subscription_id')
        .eq(matchColumn, matchValue)
        .maybeSingle();
      let row: OrgSubRow | null = (initial.data as OrgSubRow | null) ?? null;

      // Audit v2-regress-004 (2026-05-22): the customer-fallback branch
      // resolved an organization_id but never rebound `row`, so the drift
      // check below ran against the original (empty) row and missed every
      // case where the org was found via stripe_customer_id. Rebind so
      // drift detection actually runs.
      if (!row?.organization_id && !orgId) {
        const { data: byCustomer } = await admin
          .from('org_subscriptions')
          .select('organization_id, stripe_customer_id, stripe_subscription_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!byCustomer?.organization_id) return null;
        row = byCustomer as OrgSubRow;
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
        // Audit v2-regress-001 (2026-05-22): the v1 fix wrote columns
        // (event_id, event_type, expected_customer_id, …) that don't exist
        // in the deployed billing_reconciliation_log schema. The table
        // actually exposes (organization_id, discrepancy_type, local_value,
        // stripe_value, notes, checked_at). Pack the per-event detail into
        // local_value / stripe_value jsonb fields so we don't lose data.
        const driftPayload = {
          organization_id: targetOrgId,
          discrepancy_type: customerDrift
            ? 'stripe_customer_id_drift'
            : 'stripe_subscription_id_drift',
          local_value: {
            stripe_customer_id: existingCustomer ?? null,
            stripe_subscription_id: existingSubscription ?? null,
          },
          stripe_value: {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            event_id: event.id,
            event_type: event.type,
          },
          notes: customerDrift
            ? 'webhook upsert refused — customer id drift'
            : 'webhook upsert refused — subscription id drift',
          checked_at: new Date().toISOString(),
        };
        await admin
          .from('billing_reconciliation_log')
          .insert(driftPayload)
          .then(({ error: insertErr }) => {
            if (insertErr) {
              log.warn(
                { err: insertErr.message },
                '[billing/webhook] billing_reconciliation_log insert failed',
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
          // v4-025: cancel_at_period_end was previously dropped on
          // the floor. Stripe sets it when a customer schedules a
          // cancellation that takes effect at the end of the
          // current period; without persisting it the /app/billing
          // UI never shows "Your subscription will cancel on …"
          // and recovery flows can't differentiate active vs
          // already-cancelling subs.
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
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
        await writeBillingAudit({
          organizationId: orgId,
          stripeCustomerId: session.customer as string | null,
          payload: { plan_key: planKey, session_id: session.id },
        });
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

      // v4-013: status='canceled' alone leaves stale entitlements
      // (rows with enabled=true) and stale organizations.plan_key,
      // so direct-reads of org_entitlements/plan_key from pages
      // under /app keep displaying paid features. Disable every
      // entitlement row and null the org plan_key so all
      // defense-in-depth checks agree.
      if (subRow?.organization_id) {
        await disableEntitlementsForOrg(subRow.organization_id);
        await admin
          .from('organizations')
          .update({
            plan_key: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subRow.organization_id);

        await sendBillingEmail(
          admin,
          subRow.organization_id,
          'subscription_cancelled',
        );
        orgsToRevalidate.add(subRow.organization_id);
        await writeBillingAudit({
          organizationId: subRow.organization_id,
          stripeCustomerId:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : null,
          payload: {
            stripe_subscription_id: subscriptionId,
            cancellation_reason: subscription.cancellation_details?.reason ?? null,
          },
        });
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

        // v4-025: previously set status='active' for every invoice
        // paid event — including a one-off invoice paid against a
        // sub that was already in status='canceled'. That
        // resurrected dead subscriptions and re-granted access.
        // Refuse to flip canceled/incomplete_expired back to active
        // unless we're recovering from a recoverable failure state.
        const RECOVERABLE_STATES = new Set([
          'active',
          'past_due',
          'trialing',
          'pending_checkout',
          'unpaid',
          'incomplete',
        ]);
        if (
          existingRow?.status &&
          !RECOVERABLE_STATES.has(String(existingRow.status))
        ) {
          log.warn(
            {
              orgId: existingRow.organization_id,
              currentStatus: existingRow.status,
              eventId: event.id,
            },
            '[billing/webhook] invoice.paid against non-recoverable sub — refusing to resurrect',
          );
        } else {
          const wasPastDue = existingRow?.status === 'past_due';

          // v4-025: removed the `error.message.includes('payment_failed_at')`
          // fallback. The column has been in the deployed schema since
          // 20260603 (payment_recovery_columns.sql); the string-match
          // path was a residual from before that migration landed and
          // is fragile — error message wording varies across Postgres
          // versions and Supabase server upgrades.
          const { error: paidErr } = await admin
            .from('org_subscriptions')
            .update({
              status: 'active',
              trial_started_at: null,
              trial_expires_at: null,
              payment_failed_at: null,
              updated_at: new Date().toISOString(),
            })
            .match(matchCol);
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
          await writeBillingAudit({
            organizationId: subRow.organization_id,
            stripeCustomerId: customerId,
            amount: invoice.amount_due ?? null,
            currency: invoice.currency ?? null,
            payload: {
              stripe_subscription_id: subscriptionId,
              attempt_count: invoice.attempt_count ?? null,
            },
          });
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
          await writeBillingAudit({
            organizationId: subRow.organization_id,
            stripeCustomerId: customerId,
            stripeChargeId: charge.id,
            amount: refundedAmount,
            currency: charge.currency ?? null,
            payload: {
              fully_refunded: fullyRefunded,
              refund_reason: charge.refunds?.data?.[0]?.reason ?? null,
            },
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
          await writeBillingAudit({
            organizationId: subRow.organization_id,
            stripeCustomerId: customerId,
            stripeChargeId:
              typeof dispute.charge === 'string'
                ? dispute.charge
                : dispute.charge?.id ?? null,
            amount: dispute.amount ?? null,
            currency: dispute.currency ?? null,
            payload: {
              dispute_id: dispute.id,
              reason: dispute.reason ?? null,
              status: dispute.status ?? null,
            },
          });
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
          await writeBillingAudit({
            organizationId: subRow.organization_id,
            stripeCustomerId: customerId,
            stripeChargeId:
              typeof dispute.charge === 'string'
                ? dispute.charge
                : dispute.charge?.id ?? null,
            amount: dispute.amount ?? null,
            currency: dispute.currency ?? null,
            payload: {
              dispute_id: dispute.id,
              status: dispute.status ?? null,
              closed_outcome:
                dispute.status === 'won'
                  ? 'won'
                  : dispute.status === 'lost'
                    ? 'lost'
                    : 'other',
            },
          });
        }
      }
    }
  } catch (error) {
    log.error({ err: error }, 'Stripe webhook processing error:');
    captureRouteError('billing.webhook', error, {
      method: 'POST',
      url: request.url,
      eventId: event.id,
      eventType: event.type,
    });

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
