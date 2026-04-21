import Stripe from 'stripe';
import { resolvePlanKey, type PlanKey } from '@/lib/plans';
import { billingLogger } from '@/lib/observability/structured-logger';

let stripeClient: Stripe | null = null;

const DEFAULT_PRICE_IDS: Record<PlanKey, string> = {
  basic: 'price_1TOdz1AHrAKKo3OlfYxjk9WL',
  pro: 'price_1TOe05AHrAKKo3OliCrZNnkx',
  enterprise: 'price_1T9cPKAHrAKKo3OliQN78Q83',
};

function configuredPriceIds(): Record<PlanKey, string> {
  return {
    basic: process.env.STRIPE_PRICE_FOUNDATION ?? DEFAULT_PRICE_IDS.basic,
    pro: process.env.STRIPE_PRICE_GROWTH ?? DEFAULT_PRICE_IDS.pro,
    enterprise:
      process.env.STRIPE_PRICE_ENTERPRISE ?? DEFAULT_PRICE_IDS.enterprise,
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
  const priceMap: Record<string, string | undefined> = configuredPriceIds();

  const priceId = priceMap[planKey];
  if (!priceId) {
    billingLogger.warn('stripe_price_id_missing', { planKey });
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

  if (normalized === priceIds.basic) {
    return 'basic';
  }
  if (normalized === priceIds.pro) {
    return 'pro';
  }
  if (normalized === priceIds.enterprise) {
    return 'enterprise';
  }

  return resolvePlanKey(priceId);
}
