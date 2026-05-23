export type PlanKey = 'basic' | 'pro' | 'scale' | 'enterprise';

export const TRIAL_ELIGIBLE_PLANS: readonly PlanKey[] = [] as const;

export type PlanConfig = {
  key: PlanKey;
  name: string;
  summary: string;
  /** Monthly price in USD (0 = custom / contact sales) */
  priceMonthly: number;
  limits: {
    maxSites: number | 'unlimited';
    maxUsers: number | 'unlimited';
    maxFrameworks: number | 'unlimited';
  };
  features: string[];
};

export const PLAN_CATALOG: Record<PlanKey, PlanConfig> = {
  basic: {
    key: 'basic',
    name: 'Foundation',
    summary: 'Entry point for small NDIS and aged care providers',
    priceMonthly: 297,
    limits: {
      maxSites: 1,
      maxUsers: 10,
      maxFrameworks: 2,
    },
    features: [
      'Up to 2 compliance frameworks',
      'Basic workflow enforcement',
      'Audit logs and evidence history',
      'Audit log export',
      'Framework evaluation reports',
      'Up to 10 users',
      '1 site / location',
      'Guided setup checklist',
      'Email support',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Growth',
    summary: 'Sweet spot for most NDIS and healthcare providers',
    priceMonthly: 797,
    limits: {
      maxSites: 3,
      maxUsers: 25,
      maxFrameworks: 4,
    },
    features: [
      'Everything in Foundation',
      'Up to 4 compliance frameworks',
      'Full workflow enforcement',
      'Real-time audit evidence',
      'Up to 25 users',
      'Up to 3 sites / locations',
      'Multi-team usage',
      'Onboarding and implementation support',
      'Evidence exports and posture reporting',
      'Priority email support',
    ],
  },
  scale: {
    key: 'scale',
    name: 'Scale',
    summary: 'For larger disability and healthcare organisations',
    priceMonthly: 1800,
    limits: {
      maxSites: 'unlimited',
      maxUsers: 75,
      maxFrameworks: 'unlimited',
    },
    features: [
      'Everything in Growth',
      'Unlimited compliance frameworks',
      'Up to 75 users',
      'Unlimited sites / locations',
      'Multi-site governance dashboard',
      'Advanced posture reporting',
      'Webhook integrations',
      'Dedicated onboarding session',
      'Priority support with SLA',
    ],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    summary:
      'Tailored rollout, procurement, security review, and governance design',
    priceMonthly: 0,
    limits: {
      maxSites: 'unlimited',
      maxUsers: 'unlimited',
      maxFrameworks: 'unlimited',
    },
    features: [
      'Everything in Scale',
      'Unlimited users, sites & frameworks',
      'SSO & SAML authentication',
      'Custom compliance frameworks',
      'API access and webhook integrations',
      'Audit-period assistance',
      'Procurement and security review pack',
      'White-glove onboarding',
      'Dedicated account manager',
    ],
  },
};

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, value);
}

export function resolvePlanKey(
  value: string | null | undefined,
): PlanKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return isPlanKey(normalized) ? normalized : null;
}

export function isTrialEligiblePlan(planKey: PlanKey): boolean {
  return TRIAL_ELIGIBLE_PLANS.includes(planKey);
}

// ---------------------------------------------------------------------
// Audit 2026-05-23 — billing-shape helpers
// ---------------------------------------------------------------------
// Sprint 4b consolidation: lib/billing/plans.ts (SUBSCRIPTION_PLANS) was
// a second catalog with a different key set ('starter|pro|scale|
// enterprise') and a different limit dimension (members/tasks/storage/
// certificates/apiCalls vs. user-facing sites/users/frameworks above).
// To delete the duplicate without losing the runtime limits the billing
// surface depends on, we move those limits + the Stripe env mapping
// here so PLAN_CATALOG is the single source of truth and the billing
// route reads through getBillingPlan().

const BILLING_RUNTIME_LIMITS: Record<
  PlanKey,
  {
    members: number;
    tasks: number;
    storage: number;
    certificates: number;
    apiCalls: number;
  }
> = {
  basic: { members: 10, tasks: -1, storage: 10, certificates: 50, apiCalls: 10_000 },
  pro: { members: 25, tasks: -1, storage: 50, certificates: 200, apiCalls: 50_000 },
  scale: { members: 75, tasks: -1, storage: 200, certificates: -1, apiCalls: 200_000 },
  enterprise: { members: -1, tasks: -1, storage: -1, certificates: -1, apiCalls: -1 },
};

const STRIPE_PRICE_ENV: Record<PlanKey, string> = {
  basic: 'STRIPE_PRICE_FOUNDATION',
  pro: 'STRIPE_PRICE_GROWTH',
  scale: 'STRIPE_PRICE_SCALE',
  enterprise: 'STRIPE_PRICE_ENTERPRISE',
};

export interface BillingPlan {
  id: PlanKey;
  name: string;
  price: number;
  interval: 'month';
  stripePriceId?: string;
  features: string[];
  limits: (typeof BILLING_RUNTIME_LIMITS)[PlanKey];
}

export function getBillingPlan(planKey: PlanKey): BillingPlan {
  const config = PLAN_CATALOG[planKey];
  const envValue = process.env[STRIPE_PRICE_ENV[planKey]];
  const stripePriceId = envValue && envValue.trim().length > 0 ? envValue.trim() : undefined;
  return {
    id: planKey,
    name: config.name,
    price: config.priceMonthly,
    interval: 'month',
    stripePriceId,
    features: config.features,
    limits: BILLING_RUNTIME_LIMITS[planKey],
  };
}

export function getAllBillingPlans(): BillingPlan[] {
  return (Object.keys(PLAN_CATALOG) as PlanKey[]).map(getBillingPlan);
}
