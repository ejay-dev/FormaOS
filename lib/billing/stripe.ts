import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });

  return stripeClient;
}

export function getStripePriceId(planKey: string) {
  const priceMap: Record<string, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };

  const priceId = priceMap[planKey];
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for plan ${planKey}`);
  }

  return priceId;
}
