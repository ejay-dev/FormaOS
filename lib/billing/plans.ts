export type SubscriptionTier =
  | 'starter'
  | 'pro'
  | 'scale'
  | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: {
    members: number;
    tasks: number;
    storage: number;
    certificates: number;
    apiCalls: number;
  };
}

// Price IDs are env-only. Production builds fail closed via scripts/check-env.js
// when STRIPE_PRICE_* vars are missing. Hardcoded fallbacks were removed
// (Blocker/High-8) — checking real Stripe price IDs into source-controlled
// code is a secret-hygiene smell and was the root cause of "live-looking
// fallback price ID" findings in the audit.
function priceId(envKey: string): string | undefined {
  const value = process.env[envKey];
  return value && value.trim().length > 0 ? value : undefined;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Foundation',
    price: 297,
    interval: 'month',
    stripePriceId: priceId('STRIPE_PRICE_FOUNDATION'),
    features: [
      'Controlled starting point',
      'Basic workflow enforcement',
      'Audit logs and evidence history',
      'Guided setup review',
      'Email support',
      'Core compliance dashboard',
    ],
    limits: {
      members: 20,
      tasks: -1,
      storage: 10,
      certificates: 50,
      apiCalls: 10000,
    },
  },
  pro: {
    id: 'pro',
    name: 'Growth',
    price: 797,
    interval: 'month',
    stripePriceId: priceId('STRIPE_PRICE_GROWTH'),
    features: [
      'Up to 4 compliance frameworks',
      'Full workflow enforcement',
      'Real-time audit evidence',
      'Up to 25 users, 3 sites',
      'Multi-team usage',
      'Posture reporting',
      'Priority email support',
    ],
    limits: {
      members: 25,
      tasks: -1,
      storage: 50,
      certificates: 200,
      apiCalls: 50000,
    },
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 1800,
    interval: 'month',
    stripePriceId: priceId('STRIPE_PRICE_SCALE'),
    features: [
      'Unlimited compliance frameworks',
      'Everything in Growth',
      'Up to 75 users, unlimited sites',
      'Multi-site governance dashboard',
      'Webhook integrations',
      'Dedicated onboarding',
      'Priority support with SLA',
    ],
    limits: {
      members: 75,
      tasks: -1,
      storage: 200,
      certificates: -1,
      apiCalls: 200000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    interval: 'month',
    stripePriceId: priceId('STRIPE_PRICE_ENTERPRISE'),
    features: [
      'Unlimited team members',
      'Unlimited tasks',
      'Unlimited storage',
      'Unlimited certificates',
      '24/7 premium support',
      'AI compliance assistant',
      'Custom integrations',
      'Dedicated account manager',
      'SSO & SAML',
      'Advanced security',
      'SLA guarantee',
    ],
    limits: {
      members: -1,
      tasks: -1,
      storage: -1,
      certificates: -1,
      apiCalls: -1,
    },
  },
};
