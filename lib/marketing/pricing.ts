export type PublicPricingTier = {
  id: 'foundation' | 'growth' | 'enterprise';
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
// - Foundation: public self-serve. CTA routes to /auth/signup with
//   intent=checkout; after signup + org bootstrap the user is auto-redirected
//   into Stripe Checkout with session.metadata.organization_id correctly set
//   so the webhook can provision.
// - Growth: sales-led. Demo first; sales sends Stripe Payment Link post-demo
//   via the STRIPE_PAYMENT_LINK_GROWTH server env var (never exposed publicly).
// - Enterprise: invoice-only via Stripe Invoicing. No Payment Link.
export const PUBLIC_PRICING_TIERS: PublicPricingTier[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    priceLabel: '$297',
    priceSubtext: '/ month',
    audience: 'For small operators getting compliance out of spreadsheets',
    summary:
      'A focused entry point for one compliance framework, basic enforcement, and audit logs without making FormaOS feel disposable.',
    ctaLabel: 'Start Foundation Plan',
    ctaHref: '/auth/signup?plan=basic&intent=checkout&source=pricing',
    features: [
      '1 compliance framework',
      'Basic workflow enforcement',
      'Audit logs and evidence history',
      'Audit log export',
      'Framework evaluation reports',
      'Limited users and workspace scope',
      'Guided setup checklist',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: 'From $1,800',
    priceSubtext: '/ month',
    badge: 'Most Common',
    audience: 'For organisations that need audit-ready compliance',
    summary:
      'The core FormaOS operating layer: enforced workflows, live evidence, multi-team usage, and onboarding support.',
    ctaLabel: 'Start Growth Plan',
    ctaHref: '/auth/signup?plan=pro&intent=checkout&source=pricing',
    featured: true,
    features: [
      'Full workflow enforcement',
      'Real-time audit evidence',
      'Multiple compliance areas',
      'Multi-team usage',
      'Onboarding and implementation support',
      'Evidence exports and posture reporting',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'Custom',
    priceSubtext: '$5k+/month',
    audience: 'For organisations requiring full compliance infrastructure',
    summary:
      'Tailored compliance architecture for multi-site, high-risk, or procurement-heavy teams. Contracts closed via Stripe Invoicing, not self-serve checkout.',
    ctaLabel: 'Book Demo',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing',
    features: [
      'Custom workflows and controls',
      'Integrations and identity review',
      'Dedicated onboarding',
      'Audit-period assistance',
      'Procurement and security review support',
      'Invoice-based billing via Stripe Invoicing',
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
