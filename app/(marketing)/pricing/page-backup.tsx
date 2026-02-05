import type { Metadata } from 'next';
import { MarketingAnchor } from '../components/marketing-anchor';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Pricing',
  description:
    'Pricing tiers for FormaOS: Starter, Pro, and Enterprise compliance operations.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: 'FormaOS | Pricing',
    description:
      'Transparent plans for compliance-focused teams and regulated operators.',
    type: 'website',
    url: `${siteUrl}/pricing`,
  },
};

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: 'per user/month',
    description: 'Essential compliance tools for small teams',
    features: [
      'Up to 10 users',
      'Core compliance modules',
      'Basic reporting',
      'Email support',
      '14-day free trial',
      'Automated evidence storage with version history',
      'Role-based access control (RBAC)',
      'Immutable audit trail for all actions',
      'Live compliance dashboard',
      'SOC 2, ISO 27001, GDPR scanning',
    ],
  },
  {
    name: 'Professional',
    price: '$99',
    period: 'per user/month',
    description: 'Advanced features for growing compliance teams',
    features: [
      'Up to 50 users',
      'Advanced workflows',
      'Custom reporting',
      'Priority support',
      'API access',
      'Advanced integrations',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Tailored solution for large organizations',
    features: [
      'Unlimited users',
      'Custom compliance frameworks (SOC 2, ISO 27001, NDIS, etc.)',
      'White-label options',
      'Dedicated support',
      'SSO integration',
      'Dedicated onboarding & implementation support',
      'Regulatory export & reporting',
      'Enterprise SSO & MFA',
    ],
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Choose the plan that fits your compliance needs. Start with a
              14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`bg-background border rounded-xl p-8 relative ${
                  plan.popular ? 'border-primary scale-105' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-1">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <a
                    href={
                      plan.name === 'Enterprise' ? '/contact' : '/auth/signup'
                    }
                    className={`w-full btn ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    } py-3`}
                  >
                    {plan.name === 'Enterprise'
                      ? 'Contact Sales'
                      : 'Start Free Trial'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "What's included in the free trial?",
                a: 'Full access to all features for 14 days, no credit card required. All onboarding uses real organization data, with no sample/demo content.',
              },
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
              },
              {
                q: 'Do you offer custom frameworks?',
                a: 'Yes, Enterprise plans include custom compliance framework configuration to match your specific regulatory requirements.',
              },
              {
                q: 'What support do you provide?',
                a: 'All plans include comprehensive documentation and tutorials. Pro and Enterprise plans include priority support and dedicated success managers.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-background border border-border rounded-lg p-6"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-foreground/80">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingAnchor
        /* Legacy/Backup Page: Do not deploy. Trial language updated for accuracy. */
        title="Start your compliance transformation"
        subtitle="14-day free trial · No credit card required. All onboarding uses real organization data, with no sample/demo content."
        badge="Get Started"
      />
    </div>
  );
}
