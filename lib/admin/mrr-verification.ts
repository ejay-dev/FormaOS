import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/billing/stripe';
import type Stripe from 'stripe';

// Type definitions for better type safety
interface Organization {
  id: string;
  name: string | null;
}

interface OrgSubscription {
  organization_id: string;
  status: string | null;
  plan_key: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface Plan {
  key: string;
  price_cents: number | null;
}

export interface MrrVerificationResult {
  verified_at: string; // ISO timestamp
  stripe_configured: boolean;
  stripe_key_mode: 'live' | 'test' | 'unknown';

  db_mrr_cents: number;
  stripe_mrr_cents: number;
  delta_cents: number; // stripe - db
  match: boolean; // delta === 0

  db_active_count: number;
  stripe_active_count: number;

  currency: string; // from Stripe or 'unknown'
  billing_intervals_found: string[]; // e.g. ['month', 'year']

  per_subscription: Array<{
    organization_id: string;
    plan_key: string | null;
    db_status: string | null;
    stripe_status: string | null;
    db_amount_cents: number;
    stripe_amount_cents: number;
    match: boolean;
    stripe_subscription_id: string | null;
  }>;

  stripe_only: Array<{
    stripe_subscription_id: string;
    stripe_status: string;
    stripe_amount_cents: number;
    stripe_customer_id: string | null;
  }>;

  db_only: Array<{
    organization_id: string;
    plan_key: string | null;
    db_status: string;
    db_amount_cents: number;
  }>;

  errors: string[];
  duration_ms: number;
}

/**
 * Determines if an organization name is synthetic (test/QA org).
 * Replicated from lib/admin/metrics-service.ts
 */
function isSyntheticOrgName(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (
    normalized.startsWith('e2e ') ||
    normalized.includes('e2e test org') ||
    normalized.startsWith('qa smoke ') ||
    normalized.endsWith('@test.formaos.local')
  );
}

/**
 * Normalizes a subscription amount to monthly MRR.
 * For yearly subscriptions, divides by 12 and rounds.
 * For monthly subscriptions, returns the amount as-is.
 * For other intervals, returns the amount as-is.
 */
function normalizeToMonthlyMrr(
  unitAmount: number,
  interval: string | undefined,
): number {
  if (interval === 'year') {
    return Math.round(unitAmount / 12);
  }
  return unitAmount;
}

/**
 * Detects the Stripe key mode based on the secret key prefix.
 */
function detectStripeKeyMode(): 'live' | 'test' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return 'unknown';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unknown';
}

/**
 * Verifies MRR by comparing DB-computed values against live Stripe data.
 * This is a READ-ONLY operation - no data modifications are made.
 */
export async function verifyMrr(): Promise<MrrVerificationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const verified_at = new Date().toISOString();
  const stripe_key_mode = detectStripeKeyMode();

  // Initialize result with defaults
  const result: MrrVerificationResult = {
    verified_at,
    stripe_configured: false,
    stripe_key_mode,
    db_mrr_cents: 0,
    stripe_mrr_cents: 0,
    delta_cents: 0,
    match: false,
    db_active_count: 0,
    stripe_active_count: 0,
    currency: 'unknown',
    billing_intervals_found: [],
    per_subscription: [],
    stripe_only: [],
    db_only: [],
    errors,
    duration_ms: 0,
  };

  try {
    // Step 1: Query DB for active subscriptions
    const admin = createSupabaseAdminClient();

    const [orgsResult, subsResult, plansResult] = await Promise.all([
      admin.from('organizations').select('id, name'),
      admin
        .from('org_subscriptions')
        .select('organization_id, status, plan_key, stripe_subscription_id, stripe_customer_id'),
      admin.from('plans').select('key, price_cents'),
    ]);

    if (orgsResult.error) {
      errors.push(`DB query error (organizations): ${orgsResult.error.message}`);
    }
    if (subsResult.error) {
      errors.push(`DB query error (org_subscriptions): ${subsResult.error.message}`);
    }
    if (plansResult.error) {
      errors.push(`DB query error (plans): ${plansResult.error.message}`);
    }

    const organizations = orgsResult.data ?? [];
    const subscriptions = subsResult.data ?? [];
    const plans = plansResult.data ?? [];

    // Filter out synthetic orgs
    const filteredOrgs = organizations.filter(
      (org: Organization) => !isSyntheticOrgName(org.name),
    );
    const filteredOrgIds = new Set(filteredOrgs.map((org: Organization) => org.id));

    // Build plan price map
    const planPriceMap = new Map<string, number>();
    plans.forEach((plan: Plan) => {
      planPriceMap.set(plan.key, plan.price_cents ?? 0);
    });

    // Filter subscriptions to only include non-synthetic orgs with active status
    const dbActiveSubscriptions = subscriptions.filter(
      (sub: OrgSubscription) =>
        filteredOrgIds.has(sub.organization_id) &&
        (sub.status ?? '').toLowerCase() === 'active',
    );

    // Compute DB MRR
    let db_mrr_cents = 0;
    for (const sub of dbActiveSubscriptions) {
      const planKey = sub.plan_key;
      const priceCents = planPriceMap.get(planKey) ?? 0;
      db_mrr_cents += priceCents;
    }

    result.db_mrr_cents = db_mrr_cents;
    result.db_active_count = dbActiveSubscriptions.length;

    // Prepare per-subscription data structures and populate db_only
    const dbSubsByStripeId = new Map<string, OrgSubscription>();
    const dbSubsWithoutStripeId: OrgSubscription[] = [];

    for (const sub of dbActiveSubscriptions) {
      if (sub.stripe_subscription_id) {
        dbSubsByStripeId.set(sub.stripe_subscription_id, sub);
      } else {
        dbSubsWithoutStripeId.push(sub);
        // Add to db_only immediately since these have no Stripe subscription ID
        const planKey = sub.plan_key;
        const dbAmountCents = planPriceMap.get(planKey ?? '') ?? 0;

        result.db_only.push({
          organization_id: sub.organization_id,
          plan_key: planKey,
          db_status: sub.status ?? 'unknown',
          db_amount_cents: dbAmountCents,
        });
      }
    }

    // Step 2: Query Stripe for active subscriptions
    const stripe = getStripeClient();
    if (!stripe) {
      errors.push('Stripe is not configured (missing STRIPE_SECRET_KEY)');
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    result.stripe_configured = true;

    // Fetch all active subscriptions from Stripe with auto-pagination
    const stripeSubscriptions: Stripe.Subscription[] = [];
    const intervalSet = new Set<string>();
    let currencyFromStripe = 'unknown';

    try {
      for await (const subscription of stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        expand: ['data.items.data.price'],
      })) {
        stripeSubscriptions.push(subscription);

        // Extract currency and billing intervals
        if (subscription.items.data.length > 0) {
          const item = subscription.items.data[0];
          if (item.price && typeof item.price === 'object') {
            if (item.price.currency) {
              currencyFromStripe = item.price.currency;
            }
            if (item.price.recurring?.interval) {
              intervalSet.add(item.price.recurring.interval);
            }
          }
        }
      }
    } catch (stripeError: any) {
      errors.push(`Stripe API error: ${stripeError.message ?? 'Unknown error'}`);
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    result.stripe_active_count = stripeSubscriptions.length;
    result.currency = currencyFromStripe;
    result.billing_intervals_found = Array.from(intervalSet).sort();

    // Compute Stripe MRR
    let stripe_mrr_cents = 0;
    const stripeSubMap = new Map<string, Stripe.Subscription>();

    for (const subscription of stripeSubscriptions) {
      stripeSubMap.set(subscription.id, subscription);

      if (subscription.items.data.length > 0) {
        const item = subscription.items.data[0];
        if (item.price && typeof item.price === 'object') {
          const unitAmount = item.price.unit_amount ?? 0;
          const interval = item.price.recurring?.interval;

          // Normalize to monthly
          stripe_mrr_cents += normalizeToMonthlyMrr(unitAmount, interval);
        }
      }
    }

    result.stripe_mrr_cents = stripe_mrr_cents;
    result.delta_cents = stripe_mrr_cents - db_mrr_cents;
    result.match = result.delta_cents === 0;

    // Step 3: Build per-subscription comparison
    // Match DB subs with Stripe subs
    for (const dbSub of dbActiveSubscriptions) {
      const stripeSubId = dbSub.stripe_subscription_id;
      const planKey = dbSub.plan_key;
      const dbAmountCents = planPriceMap.get(planKey) ?? 0;

      let stripeAmountCents = 0;
      let stripeStatus: string | null = null;

      if (stripeSubId && stripeSubMap.has(stripeSubId)) {
        const stripeSub = stripeSubMap.get(stripeSubId)!;
        stripeStatus = stripeSub.status;

        if (stripeSub.items.data.length > 0) {
          const item = stripeSub.items.data[0];
          if (item.price && typeof item.price === 'object') {
            const unitAmount = item.price.unit_amount ?? 0;
            const interval = item.price.recurring?.interval;
            stripeAmountCents = normalizeToMonthlyMrr(unitAmount, interval);
          }
        }
      }

      result.per_subscription.push({
        organization_id: dbSub.organization_id,
        plan_key: planKey,
        db_status: dbSub.status,
        stripe_status: stripeStatus,
        db_amount_cents: dbAmountCents,
        stripe_amount_cents: stripeAmountCents,
        match: dbAmountCents === stripeAmountCents && stripeStatus === 'active',
        stripe_subscription_id: stripeSubId,
      });
    }

    // Find Stripe-only subscriptions (in Stripe but not in DB)
    for (const [stripeSubId, stripeSub] of stripeSubMap.entries()) {
      if (!dbSubsByStripeId.has(stripeSubId)) {
        let stripeAmountCents = 0;
        if (stripeSub.items.data.length > 0) {
          const item = stripeSub.items.data[0];
          if (item.price && typeof item.price === 'object') {
            const unitAmount = item.price.unit_amount ?? 0;
            const interval = item.price.recurring?.interval;
            stripeAmountCents = normalizeToMonthlyMrr(unitAmount, interval);
          }
        }

        result.stripe_only.push({
          stripe_subscription_id: stripeSubId,
          stripe_status: stripeSub.status,
          stripe_amount_cents: stripeAmountCents,
          stripe_customer_id: stripeSub.customer as string | null,
        });
      }
    }
  } catch (error: any) {
    errors.push(`Verification error: ${error.message ?? 'Unknown error'}`);
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}
