export type PublicPricingTier = {
  id: 'foundation' | 'growth' | 'scale' | 'enterprise';
  name: string;
  priceLabel: string;
  priceSubtext: string;
  badge?: string;
  audience: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  features: string[];
};

// Buying motions:
// - Foundation: public self-serve. CTA → /auth/signup?plan=basic&intent=checkout
// - Growth: self-serve. CTA → /auth/signup?plan=pro&intent=checkout
// - Scale: self-serve. CTA → /auth/signup?plan=scale&intent=checkout
//   (requires STRIPE_PRICE_SCALE env — placeholder until Stripe product is created)
// - Enterprise: invoice-only via Stripe Invoicing. No self-serve checkout.
export const PUBLIC_PRICING_TIERS: PublicPricingTier[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    priceLabel: '$297',
    priceSubtext: '/ month',
    audience: 'Small NDIS and aged care providers — up to 10 staff, 1 location',
    summary:
      'Move your compliance off spreadsheets. One framework, audit-ready evidence, and workflow enforcement for small registered providers.',
    ctaLabel: 'Start Foundation Plan',
    ctaHref: '/auth/signup?plan=basic&intent=checkout&source=pricing',
    features: [
      '10 users included',
      '1 site / location',
      '2 compliance frameworks (e.g. NDIS + WHS)',
      'Basic workflow enforcement',
      'Immutable audit log + evidence history',
      'Audit log export for Commission reviews',
      'Framework evaluation reports',
      'Guided setup checklist',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: '$797',
    priceSubtext: '/ month',
    badge: 'Most Popular',
    audience:
      'Growing NDIS/healthcare providers — 10–25 staff, up to 3 locations',
    summary:
      "The sweet spot for typical registered providers. Full workflow enforcement, multi-site support, and onboarding assistance so you're audit-ready from day one.",
    ctaLabel: 'Start Growth Plan',
    ctaHref: '/auth/signup?plan=pro&intent=checkout&source=pricing',
    featured: true,
    features: [
      '25 users included',
      'Up to 3 sites / locations',
      '4 compliance frameworks',
      'Full workflow enforcement with approval gates',
      'Real-time audit evidence capture',
      'NDIS Practice Standards pre-built',
      'Worker screening + credential expiry alerts',
      'Multi-team usage and role-based access',
      'Evidence exports and posture reporting',
      'Onboarding and implementation support',
      'Priority email support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    priceLabel: '$1,800',
    priceSubtext: '/ month',
    audience:
      'Larger disability and healthcare organisations — up to 75 staff, multiple sites',
    summary:
      'Unlimited frameworks, unlimited sites, and governance dashboards for organisations running complex multi-site compliance operations.',
    ctaLabel: 'Start Scale Plan',
    ctaHref: '/auth/signup?plan=scale&intent=checkout&source=pricing',
    features: [
      '75 users included',
      'Unlimited sites / locations',
      'Unlimited compliance frameworks',
      'Everything in Growth',
      'Multi-site governance dashboard',
      'Advanced posture and risk reporting',
      'Webhook integrations',
      'Dedicated onboarding session',
      'Priority support with response SLA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'Custom',
    priceSubtext: 'from $5k/month',
    audience:
      'Multi-entity organisations requiring full compliance infrastructure',
    summary:
      'Tailored compliance architecture, procurement support, and security review for high-risk or procurement-heavy organisations. Contracts via Stripe Invoicing.',
    ctaLabel: 'Book a Demo',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing',
    features: [
      'Unlimited users, sites and frameworks',
      'Everything in Scale',
      'SSO & SAML authentication',
      'Custom compliance frameworks and controls',
      'API access and custom integrations',
      'Audit-period assistance',
      'Procurement and security review pack',
      'White-glove onboarding',
      'Dedicated account manager',
    ],
  },
];

export const MANUAL_COMPLIANCE_COST_ANCHORS = [
  { label: 'Audit prep', manual: '2-6 weeks', formaos: 'Hours' },
  {
    label: 'Staff hours',
    manual: '80-200+',
    formaos: 'Evidence generated as work happens',
  },
  {
    label: 'Failure risk',
    manual: 'High',
    formaos: 'Controlled by workflow gates',
  },
  {
    label: 'Evidence state',
    manual: 'Chased late',
    formaos: 'Logged continuously',
  },
] as const;
