import Stripe from 'stripe';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { billingLogger } from '@/lib/observability/structured-logger';

let stripeClient: Stripe | null = null;

// Dev/test fallbacks. In production we fail closed (return null) when env is
// missing rather than charging against an unverified price ID.
const DEV_FALLBACK_PRICE_IDS: Record<PlanKey, string> = {
  basic: 'price_test_basic_placeholder',
  pro: 'price_test_pro_placeholder',
  scale: 'price_test_scale_placeholder',
  enterprise: 'price_test_enterprise_placeholder',
};

function configuredPriceIds(): Record<PlanKey, string | null> {
  const isProduction = process.env.NODE_ENV === 'production';
  const fallback = (key: PlanKey) =>
    isProduction ? null : DEV_FALLBACK_PRICE_IDS[key];

  return {
    basic: process.env.STRIPE_PRICE_FOUNDATION ?? fallback('basic'),
    pro: process.env.STRIPE_PRICE_GROWTH ?? fallback('pro'),
    scale: process.env.STRIPE_PRICE_SCALE ?? fallback('scale'),
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? fallback('enterprise'),
  };
}

export function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    billingLogger.warn('stripe_secret_key_missing');
    return null;
  }

  // Audit 2026-05-26 — Stripe SDK 15 → 22 upgrade. apiVersion bumped
  // to the SDK's pinned version. Two semantic changes in the response
  // shape required call-site updates:
  //   * Subscription.current_period_end / current_period_start moved
  //     off the top-level object onto each subscription item.
  //   * Invoice.subscription was removed; the relationship now lives
  //     under invoice.parent.subscription_details.subscription.
  // See migration sites below where we read those fields.
  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia',
  });

  return stripeClient;
}

/**
 * Audit 2026-05-26 — Stripe SDK 15 → 22.
 * On apiVersion 2026-04-22.dahlia, Subscription.current_period_end
 * (and current_period_start) moved off the top-level object onto
 * each subscription item. Most FormaOS subscriptions have a single
 * item; use the first item's value as the canonical period end.
 * Returns null if the subscription has no items (defensive — the
 * Stripe schema permits empty items.data on cancelled subs).
 */
export function subscriptionPeriodEnd(
  sub: Stripe.Subscription,
): number | null {
  const item = sub.items?.data?.[0];
  return (item?.current_period_end as number | undefined) ?? null;
}

export function subscriptionPeriodStart(
  sub: Stripe.Subscription,
): number | null {
  const item = sub.items?.data?.[0];
  return (item?.current_period_start as number | undefined) ?? null;
}

/**
 * Audit 2026-05-26 — Stripe SDK 15 → 22.
 * Invoice.subscription was removed in 2025-09-30; the linked
 * subscription id now lives under
 * invoice.parent.subscription_details.subscription. This helper
 * tolerates both shapes so legacy snapshots stay readable.
 */
export function invoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  // Newer shape: parent.subscription_details.subscription
  const parent = (invoice as unknown as {
    parent?: {
      subscription_details?: { subscription?: string | Stripe.Subscription };
    };
  }).parent;
  const fromParent = parent?.subscription_details?.subscription;
  if (typeof fromParent === 'string') return fromParent;
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent) {
    return fromParent.id;
  }
  // Legacy shape: top-level .subscription (still emitted by some
  // older webhook payloads).
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription })
    .subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object' && 'id' in legacy) {
    return legacy.id;
  }
  return null;
}

export function getStripePriceId(planKey: string): string | null {
  const priceMap = configuredPriceIds() as Record<
    string,
    string | null | undefined
  >;

  const priceId = priceMap[planKey];
  if (!priceId) {
    billingLogger.warn('stripe_price_id_missing', {
      planKey,
      env: process.env.NODE_ENV,
    });
    return null;
  }

  return priceId;
}

export function resolvePlanKeyFromPriceId(
  priceId: string | null | undefined,
): PlanKey | null {
  if (!priceId) return null;
  const normalized = priceId.trim();
  const priceIds = configuredPriceIds();

  if (priceIds.basic && normalized === priceIds.basic) {
    return 'basic';
  }
  if (priceIds.pro && normalized === priceIds.pro) {
    return 'pro';
  }
  if (priceIds.scale && normalized === priceIds.scale) {
    return 'scale';
  }
  if (priceIds.enterprise && normalized === priceIds.enterprise) {
    return 'enterprise';
  }

  return resolvePlanKey(priceId);
}
