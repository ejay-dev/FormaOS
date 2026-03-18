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

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
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
    name: 'Starter',
    price: 29,
    interval: 'month',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      'Up to 20 team members',
      'Unlimited tasks',
      '10GB storage',
      '50 certificates',
      'Email support',
      'Analytics dashboard',
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
    name: 'Professional',
    price: 99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Up to 100 team members',
      'Unlimited tasks',
      '100GB storage',
      'Unlimited certificates',
      'Priority support',
      'Advanced analytics',
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
    price: 299,
    interval: 'month',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
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
