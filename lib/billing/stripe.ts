import Stripe from 'stripe';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { billingLogger } from '@/lib/observability/structured-logger';

let stripeClient: Stripe | null = null;

// Dev/test fallbacks. In production we fail closed (return null) when env is
// missing rather than charging against an unverified price ID.
const DEV_FALLBACK_PRICE_IDS: Record<PlanKey, string> = {
  basic: 'price_1TOdz1AHrAKKo3OlfYxjk9WL',
  pro: 'price_1TU6oqAHrAKKo3OlWUhJa2ZX',
  scale: 'price_1TU6rzAHrAKKo3Ol32xT6JW2',
  enterprise: 'price_1T9cPKAHrAKKo3OliQN78Q83',
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

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2024-04-10',
  });

  return stripeClient;
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
