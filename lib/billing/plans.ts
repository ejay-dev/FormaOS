export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

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

const DEFAULT_FOUNDATION_PRICE_ID = 'price_1TOdz1AHrAKKo3OlfYxjk9WL';
const DEFAULT_GROWTH_PRICE_ID = 'price_1TOe05AHrAKKo3OliCrZNnkx';

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Evaluation Access',
    price: 0,
    interval: 'month',
    features: [
      'Up to 5 team members',
      '50 tasks per month',
      '1GB storage',
      '10 certificates',
      'Basic support',
    ],
    limits: {
      members: 5,
      tasks: 50,
      storage: 1,
      certificates: 10,
      apiCalls: 1000,
    },
  },
  starter: {
    id: 'starter',
    name: 'Foundation',
    price: 297,
    interval: 'month',
    stripePriceId:
      process.env.STRIPE_PRICE_FOUNDATION ??
      DEFAULT_FOUNDATION_PRICE_ID,
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
    price: 1800,
    interval: 'month',
    stripePriceId:
      process.env.STRIPE_PRICE_GROWTH ??
      DEFAULT_GROWTH_PRICE_ID,
    features: [
      'Full workflow enforcement',
      'Real-time audit evidence',
      'Multi-team usage',
      'Multiple compliance areas',
      'Priority support',
      'Posture reporting',
      'Custom workflows',
      'API access',
    ],
    limits: {
      members: 100,
      tasks: -1,
      storage: 100,
      certificates: -1,
      apiCalls: 100000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
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
