export type PlanKey = 'basic' | 'pro' | 'enterprise';

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
    summary: 'Controlled starting point for smaller regulated teams',
    priceMonthly: 297,
    limits: {
      maxSites: 2,
      maxUsers: 15,
      maxFrameworks: 2,
    },
    features: [
      'Single-framework compliance assessment',
      'Basic workflow enforcement',
      'Audit logs',
      'Guided onboarding review',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Growth',
    summary: 'Primary plan for operational compliance teams',
    priceMonthly: 1800,
    limits: {
      maxSites: 10,
      maxUsers: 75,
      maxFrameworks: 5,
    },
    features: [
      'Everything in Foundation',
      'Full workflow enforcement',
      'Real-time audit evidence',
      'Operational dashboards',
      'Onboarding support',
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
      'Everything in Growth',
      'Unlimited sites, users & frameworks',
      'SSO & SAML authentication',
      'Custom compliance frameworks',
      'Webhook integrations',
      'Priority support SLA',
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
