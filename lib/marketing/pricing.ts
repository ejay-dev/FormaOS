export type PublicPricingTier = {
  id: 'foundation' | 'growth' | 'scale' | 'enterprise';
  name: string;
  priceLabel: string;
  priceSubtext: string;
  badge?: string;
  badgeTone?: 'popular' | 'value' | 'enterprise';
  audience: string;
  audienceSize: string;
  summary: string;
  trustNote: string;
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
    audience: 'For solo operators and micro NDIS providers',
    audienceSize: '1 site · up to 10 staff',
    summary:
      'Get audit-ready without drowning in paperwork. Move policies, evidence, and workflows off spreadsheets and into one system the NDIS Commission expects to see.',
    trustNote: 'Billed monthly · cancel anytime',
    ctaLabel: 'Start Foundation',
    ctaHref: '/auth/signup?plan=basic&intent=checkout&source=pricing',
    features: [
      '10 users · 1 site',
      '2 compliance frameworks (e.g. NDIS Practice Standards + WHS)',
      'Audit-ready evidence trail for Commission reviews',
      'Workflow enforcement for the controls you set',
      'Immutable audit log with one-click export',
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
    badgeTone: 'popular',
    audience: 'For most registered NDIS and healthcare providers',
    audienceSize: 'Up to 3 sites · 10–25 staff',
    summary:
      "Your compliance infrastructure for the next three years. Full enforcement, multi-site support, and pre-built NDIS Practice Standards so you're audit-ready from day one.",
    trustNote: 'Billed monthly · cancel anytime · onboarding included',
    ctaLabel: 'Start Growth',
    ctaHref: '/auth/signup?plan=pro&intent=checkout&source=pricing',
    featured: true,
    features: [
      '25 users · up to 3 sites',
      '4 compliance frameworks',
      'NDIS Practice Standards pre-built',
      'Workflow enforcement with approval gates',
      'Worker screening and credential expiry alerts',
      'Real-time evidence capture',
      'Multi-team usage with role-based access',
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
    badge: 'Best for multi-site',
    badgeTone: 'value',
    audience: 'For multi-site NDIS, disability, and aged care networks',
    audienceSize: 'Unlimited sites · up to 75 staff',
    summary:
      'One platform for your whole network. Unlimited frameworks, unlimited sites, and governance dashboards so leaders can see compliance posture across every team.',
    trustNote: 'Billed monthly · dedicated onboarding · SLA-backed support',
    ctaLabel: 'Start Scale',
    ctaHref: '/auth/signup?plan=scale&intent=checkout&source=pricing',
    features: [
      '75 users · unlimited sites',
      'Unlimited compliance frameworks',
      'Everything in Growth',
      'Multi-site governance dashboard',
      'Workflow automation across teams',
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
    priceSubtext: 'tailored agreement',
    badge: 'Procurement-ready',
    badgeTone: 'enterprise',
    audience: 'For networks, peak bodies, and government-adjacent providers',
    audienceSize: 'Unlimited everything · custom rollout',
    summary:
      "We build it with you. Tailored compliance architecture, procurement and security review, white-glove onboarding, and a dedicated account manager. Contracted directly with our team — no self-serve checkout.",
    trustNote: 'Annual agreements · invoice billing · custom SLA',
    ctaLabel: 'Talk to us',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing',
    features: [
      'Unlimited users, sites, and frameworks',
      'Everything in Scale',
      'SSO and SAML authentication',
      'Directory sync and provisioning',
      'Custom compliance frameworks and controls',
      'API access and custom integrations',
      'Audit-period assistance and Commission review support',
      'Procurement and security review pack',
      'White-glove onboarding and dedicated CSM',
      'Retention governance and executive rollup reporting',
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
