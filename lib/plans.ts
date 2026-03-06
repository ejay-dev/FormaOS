export type PlanKey = "basic" | "pro" | "enterprise";

export type PlanConfig = {
  key: PlanKey;
  name: string;
  summary: string;
  /** Monthly price in USD (0 = custom / contact sales) */
  priceMonthly: number;
  limits: {
    maxSites: number | "unlimited";
    maxUsers: number | "unlimited";
    maxFrameworks: number | "unlimited";
  };
  features: string[];
};

export const PLAN_CATALOG: Record<PlanKey, PlanConfig> = {
  basic: {
    key: "basic",
    name: "Starter",
    summary: "For small providers and solo operators running essential compliance workflows.",
    priceMonthly: 29,
    limits: {
      maxSites: 2,
      maxUsers: 15,
      maxFrameworks: 2,
    },
    features: ["Core compliance engine", "Tasks and evidence management", "Audit logs", "Standard reporting"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    summary: "For growing organizations operating across sites and teams.",
    priceMonthly: 99,
    limits: {
      maxSites: 10,
      maxUsers: 75,
      maxFrameworks: 5,
    },
    features: [
      "Everything in Starter",
      "Advanced reporting",
      "Governance controls",
      "Operational dashboards",
      "Workflow automation",
    ],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    summary: "For organizations seeking full compliance coverage with unlimited scale.",
    priceMonthly: 399,
    limits: {
      maxSites: "unlimited",
      maxUsers: "unlimited",
      maxFrameworks: "unlimited",
    },
    features: [
      "Everything in Pro",
      "Unlimited sites, users & frameworks",
      "SSO & SAML authentication",
      "Custom compliance frameworks",
      "Webhook integrations",
      "Priority support SLA",
      "White-glove onboarding",
      "Dedicated account manager",
    ],
  },
};

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, value);
}

export function resolvePlanKey(value: string | null | undefined): PlanKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return isPlanKey(normalized) ? normalized : null;
}
