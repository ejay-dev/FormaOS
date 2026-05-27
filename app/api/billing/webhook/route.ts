import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  getStripeClient,
  resolvePlanKeyFromPriceId,
  subscriptionPeriodEnd,
  invoiceSubscriptionId,
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
import { pageOnCall } from '@/lib/observability/paging';
import { captureStripeEvent } from '@/lib/analytics/posthog-server';

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
    // v4-022 + audit 2026-05-26: signature-mismatch is either a
    // webhook-secret rotation that left prod out of sync (silent
    // paid-cancellation breakage) or an active forgery attempt. Both
    // deserve a Sentry alert. Use captureMessage so the signal isn't
    // grouped under the generic Stripe-error fingerprint. Tags carry
    // enough metadata for ops to triage a rotation incident from
    // Sentry alone without needing the raw body.
    log.error({ err: error }, 'Stripe webhook signature error:');
    Sentry.captureMessage('stripe_webhook_signature_failure', {
      level: 'error',
      tags: {
        component: 'billing.webhook',
        operation: 'constructEvent',
        vercel_env: process.env.VERCEL_ENV ?? 'unknown',
      },
      extra: {
        rawBodyLength: rawBody.length,
        signaturePresent: Boolean(signature),
        errorMessage:
          error instanceof Error ? error.message : 'unknown error',
      },
    });
    // H1 (2026-05-26): P0 page — signature failure either means our
    // webhook secret rotated out of sync (active customers' billing
    // events silently dropping) or someone is forging Stripe traffic.
    // Both are wake-the-founder-tier events. `pageOnCall` no-ops if
    // PAGERDUTY_ROUTING_KEY isn't set, so this stays safe in dev.
    void pageOnCall({
      severity: 'error',
      summary: 'Stripe webhook signature failure',
      component: 'billing.webhook',
      dedupKey: `billing.webhook.signature:${process.env.VERCEL_ENV ?? 'unknown'}`,
      context: {
        vercelEnv: process.env.VERCEL_ENV ?? 'unknown',
        signaturePresent: Boolean(signature),
        errorMessage:
          error instanceof Error ? error.message : 'unknown error',
      },
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Audit 2026-05-26 — livemode validation. A staging environment
  // misconfigured with production Stripe keys (or production with
  // test keys) would otherwise silently process events against the
  // wrong data set. STRIPE_REQUIRE_LIVEMODE_IN_PROD lets the env
  // gate be tightened in stages; default is "enforce in production".
  // The check is OFF entirely outside production so test fixtures and
  // dev replays (which omit livemode) keep working.
  const expectLive =
    process.env.STRIPE_REQUIRE_LIVEMODE_IN_PROD === 'false' ||
    process.env.NODE_ENV !== 'production'
      ? null
      : true;
  if (
    expectLive !== null &&
    typeof event.livemode === 'boolean' &&
    event.livemode !== expectLive
  ) {
    log.error(
      {
        eventId: event.id,
        eventType: event.type,
        eventLivemode: event.livemode,
        expected: expectLive,
        nodeEnv: process.env.NODE_ENV,
      },
      'Stripe webhook livemode mismatch — refusing to process',
    );
    Sentry.captureMessage('stripe_webhook_livemode_mismatch', {
      level: 'fatal',
      tags: {
        component: 'billing.webhook',
        operation: 'livemode_check',
        event_type: event.type,
        event_livemode: String(event.livemode),
      },
      extra: { eventId: event.id, expected: expectLive },
    });
    // Return 200 so Stripe stops retrying — the event is rejected by
    // policy, not by transient failure. 2xx with no side effects is
    // the documented pattern for "this event doesn't apply to me".
    return NextResponse.json(
      { ok: false, refused: 'livemode_mismatch' },
      { status: 200 },
    );
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

      // v4-031: when metadata claims an organization_id but no row
      // matches that org_id, cross-check by stripe_customer_id. If the
      // customer is already bound to a DIFFERENT org, refuse the
      // first-bind — an attacker with Stripe API/Dashboard access who
      // can stamp metadata.organization_id on a webhook-signed event
      // could otherwise rebind a victim's billing on a fresh
      // checkout.session.completed delivery for an existing customer.
      if (!row?.organization_id && orgId && customerId) {
        const { data: byCustomer } = await admin
          .from('org_subscriptions')
          .select('organization_id, stripe_customer_id, stripe_subscription_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (
          byCustomer?.organization_id &&
          byCustomer.organization_id !== orgId
        ) {
          log.error(
            {
              metadataOrgId: orgId,
              boundOrgId: byCustomer.organization_id,
              customerId,
              subscriptionId,
              eventId: event.id,
              eventType: event.type,
            },
            '[billing/webhook] metadata.organization_id mismatch vs bound customer — refusing first-bind',
          );
          await admin
            .from('billing_reconciliation_log')
            .insert({
              organization_id: byCustomer.organization_id,
              discrepancy_type: 'metadata_org_mismatch',
              local_value: { bound_organization_id: byCustomer.organization_id },
              stripe_value: {
                metadata_organization_id: orgId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                event_id: event.id,
                event_type: event.type,
              },
              notes:
                'webhook first-bind refused — metadata claimed a different org than the customer is already bound to',
              checked_at: new Date().toISOString(),
            })
            .then(({ error: insertErr }) => {
              if (insertErr) {
                log.warn(
                  { err: insertErr.message },
                  '[billing/webhook] billing_reconciliation_log insert failed',
                );
              }
            });
          return null;
        }
        // Customer not yet bound anywhere — first-bind permitted.
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

      const periodEndUnix = subscriptionPeriodEnd(subscription);
      const currentPeriodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
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
      const sessionOrgId = session.metadata?.organization_id ?? null;
      const sessionPlanKey = resolvePlanKey(session.metadata?.plan_key ?? null);
      const subscriptionId = session.subscription as string | null;

      // P0-4 (2026-05-26): route checkout.session.completed through
      // upsertFromSubscription so the first-bind + customer-drift +
      // subscription-drift guards used by customer.subscription.* apply
      // here too. Without this, a replayed or forged checkout session
      // referencing an existing Stripe customer could silently rebind
      // that customer to a different org via session.metadata.
      if (!subscriptionId) {
        log.warn(
          {
            sessionId: session.id,
            orgId: sessionOrgId,
            customerId: session.customer,
            eventId: event.id,
          },
          '[billing/webhook] checkout.session.completed without subscription id — skipping (subscription mode is required)',
        );
      } else {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const upsertedOrgId = await upsertFromSubscription(subscription);
        if (upsertedOrgId) {
          await writeBillingAudit({
            organizationId: upsertedOrgId,
            stripeCustomerId: session.customer as string | null,
            payload: {
              plan_key:
                sessionPlanKey ??
                resolvePlanKey(subscription.metadata?.plan_key ?? null),
              session_id: session.id,
            },
          });
        } else {
          // upsertFromSubscription wrote a billing_reconciliation_log row.
          log.warn(
            {
              sessionId: session.id,
              metadataOrgId: sessionOrgId,
              subscriptionId,
              eventId: event.id,
            },
            '[billing/webhook] checkout upsert refused by drift / first-bind guard',
          );
        }
      }
    }

    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = await upsertFromSubscription(subscription);
      if (orgId) {
        await sendBillingEmail(admin, orgId, 'subscription_created');
        const planKey = resolvePlanKeyFromPriceId(
          subscription.items.data[0]?.price?.id ?? null,
        );
        await captureStripeEvent('billing.subscription.created', {
          orgId,
          planKey,
          status: subscription.status,
          priceCents: subscription.items.data[0]?.price?.unit_amount ?? null,
          currency: subscription.items.data[0]?.price?.currency ?? null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = (
        event.data as { previous_attributes?: Record<string, unknown> }
      ).previous_attributes;
      await upsertFromSubscription(subscription);
      const updatedOrgId = subscription.metadata?.organization_id ?? null;
      if (updatedOrgId) {
        await captureStripeEvent('billing.subscription.updated', {
          orgId: updatedOrgId,
          planKey: resolvePlanKeyFromPriceId(subscription.items.data[0]?.price?.id ?? null),
          status: subscription.status,
          priceCents: subscription.items.data[0]?.price?.unit_amount ?? null,
          currency: subscription.items.data[0]?.price?.currency ?? null,
        });
      }

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
        await captureStripeEvent('billing.subscription.canceled', {
          orgId: subRow.organization_id,
          status: 'canceled',
        });
      }
    }

    // P1-D (2026-05-26): Stripe Smart Retries can pause a subscription
    // after consecutive payment failures. Without this branch, the local
    // status stays 'active' (or 'past_due') and entitlement gates make
    // the wrong call. Mirror the paused state and write a billing-audit
    // signal so ops can see why access dropped.
    if (event.type === 'customer.subscription.paused') {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : null;

      const { data: subRow } = await admin
        .from('org_subscriptions')
        .select('organization_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      const { error: pauseErr } = await admin
        .from('org_subscriptions')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);
      if (pauseErr) {
        log.error(
          { err: pauseErr.message },
          '[billing/webhook] customer.subscription.paused update failed:',
        );
        throw pauseErr;
      }

      if (subRow?.organization_id) {
        orgsToRevalidate.add(subRow.organization_id);
        await writeBillingAudit({
          organizationId: subRow.organization_id,
          stripeCustomerId: customerId,
          payload: {
            stripe_subscription_id: subscriptionId,
            pause_collection_behavior:
              subscription.pause_collection?.behavior ?? null,
            pause_resumes_at: subscription.pause_collection?.resumes_at ?? null,
          },
        });
      }
    }

    // P1-D (2026-05-26): a Stripe operator (or our own retry-invoice
    // admin action) can void an open invoice. Persist a billing-audit
    // signal so the admin console + reconciliation can see the void.
    // status of the org subscription is unchanged here — voiding doesn't
    // imply cancel; that comes via customer.subscription.deleted.
    if (event.type === 'invoice.voided') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : null;

      const matchCol = subscriptionId
        ? { stripe_subscription_id: subscriptionId }
        : customerId
          ? { stripe_customer_id: customerId }
          : null;

      if (matchCol) {
        const { data: subRow } = await admin
          .from('org_subscriptions')
          .select('organization_id')
          .match(matchCol)
          .maybeSingle();

        if (subRow?.organization_id) {
          orgsToRevalidate.add(subRow.organization_id);
          await writeBillingAudit({
            organizationId: subRow.organization_id,
            stripeCustomerId: customerId,
            amount: invoice.amount_due ?? null,
            currency: invoice.currency ?? null,
            payload: {
              stripe_subscription_id: subscriptionId,
              stripe_invoice_id: invoice.id ?? null,
              void_reason: 'invoice.voided',
            },
          });
        }
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

    // Audit 2026-05-26 — customer.deleted handler (Compliance L25).
    // Without this, a deleted Stripe customer left
    // org_subscriptions.stripe_customer_id pointing at a non-existent
    // entity and the nightly reconciler had no path to clear it.
    // Null out the customer id + flag the org for ops review.
    if (event.type === 'customer.deleted') {
      const customer = event.data.object as Stripe.Customer;
      const { data: subRow } = await admin
        .from('org_subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', customer.id)
        .maybeSingle();

      if (subRow?.organization_id) {
        await admin
          .from('org_subscriptions')
          .update({
            stripe_customer_id: null,
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', subRow.organization_id);
        orgsToRevalidate.add(subRow.organization_id);
        log.warn(
          { orgId: subRow.organization_id, customerId: customer.id },
          '[billing/webhook] customer.deleted — local stripe_customer_id cleared',
        );
      } else {
        log.info(
          { customerId: customer.id },
          '[billing/webhook] customer.deleted for unknown customer (idempotent no-op)',
        );
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
      const subscriptionId = invoiceSubscriptionId(invoice);
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
      const subscriptionId = invoiceSubscriptionId(invoice);
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
          // dispute_open / dispute_opened_at / dispute_closed_at were
          // added by migration 20260624008_audit_v2_regression_fixes
          // (applied to prod 2026-05-26). The defensive column-missing
          // fallback that used to wrap this update has been removed.
          const { error: updateErr } = await admin
            .from('org_subscriptions')
            .update({
              dispute_open: true,
              dispute_opened_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', subRow.organization_id);
          if (updateErr) {
            log.error(
              { err: updateErr.message, eventId: event.id },
              '[billing/webhook] charge.dispute.created update failed',
            );
            throw updateErr;
          }
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
          // See note on charge.dispute.created above — fallback removed
          // now that migration 20260624008 is applied.
          const { error: updateErr } = await admin
            .from('org_subscriptions')
            .update({
              dispute_open: false,
              dispute_closed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', subRow.organization_id);
          if (updateErr) {
            log.error(
              { err: updateErr.message, eventId: event.id },
              '[billing/webhook] charge.dispute.closed update failed',
            );
            throw updateErr;
          }
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
