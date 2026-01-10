import Stripe from "stripe";
import { resolvePlanKey, type PlanKey } from "@/lib/plans";

let stripeClient: Stripe | null = null;

const DEFAULT_PRICE_IDS: Record<Exclude<PlanKey, "enterprise">, string> = {
  basic: "price_1So1UsAHrAKKo3OlrgiqfEcc",
  pro: "price_1So1VmAHrAKKo3OlP6k9TMn4",
};

export function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[Stripe] Missing STRIPE_SECRET_KEY.");
    return null;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-04-10",
  });

  return stripeClient;
}

export function getStripePriceId(planKey: string): string | null {
  const priceMap: Record<string, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC ?? DEFAULT_PRICE_IDS.basic,
    pro: process.env.STRIPE_PRICE_PRO ?? DEFAULT_PRICE_IDS.pro,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };

  const priceId = priceMap[planKey];
  if (!priceId) {
    console.error(`[Stripe] Missing price ID for plan ${planKey}.`);
    return null;
  }

  return priceId;
}

export function resolvePlanKeyFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  const normalized = priceId.trim();

  if (normalized === (process.env.STRIPE_PRICE_BASIC ?? DEFAULT_PRICE_IDS.basic)) {
    return "basic";
  }
  if (normalized === (process.env.STRIPE_PRICE_PRO ?? DEFAULT_PRICE_IDS.pro)) {
    return "pro";
  }
  if (process.env.STRIPE_PRICE_ENTERPRISE && normalized === process.env.STRIPE_PRICE_ENTERPRISE) {
    return "enterprise";
  }

  return resolvePlanKey(priceId);
}
