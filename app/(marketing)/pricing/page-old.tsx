import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingAnchor } from '../components/marketing-anchor';
import {
  DollarSign,
  Target,
  Users,
  Shield,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
} from '@/components/motion';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Pricing',
  description:
    'Simple, transparent pricing for compliance teams. Start free, scale as you grow.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: 'FormaOS | Pricing',
    description:
      'Transparent pricing for compliance management. Free trial, no setup fees, cancel anytime.',
    type: 'website',
    url: `${siteUrl}/pricing`,
  },
};

function PricingHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <AnimatedSystemGrid />
      </div>

      {/* Pulsing nodes - hidden on mobile */}
      <div className="hidden sm:block">
        <PulsingNode x="12%" y="25%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="88%" y="35%" delay={0.5} />
        <PulsingNode x="18%" y="75%" delay={1} />
        <PulsingNode x="82%" y="85%" delay={1.5} color="rgb(6, 182, 212)" />
      </div>

      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-secondary/20 blur-[60px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[250px] sm:h-[500px] w-[250px] sm:w-[500px] rounded-full bg-primary/15 blur-[50px] sm:blur-[100px]" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <ParallaxLayer speed={0.3}>
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-secondary/30"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Transparent Pricing
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Simple pricing that
              <br />
              <span className="relative">
                <span className="text-gradient">scales with your team</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-secondary via-primary to-accent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto"
            >
              Start your compliance journey with a free trial. No setup fees, no
              long-term contracts, cancel anytime.
            </motion.p>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

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
      'Automated evidence storage with version history',
      'Role-based access control (RBAC)',
      'Immutable audit trail for all actions',
      'Live compliance dashboard',
      'SOC 2, ISO 27001, GDPR scanning',
    ],
  },
  {
    name: 'Professional',
    price: '$89',
    period: 'per user/month',
    description: 'Advanced features for growing organizations',
    features: [
      'Up to 50 users',
      'All compliance modules',
      'Advanced reporting & analytics',
      'Priority support',
      'Custom compliance frameworks (SOC 2, ISO 27001, NDIS, etc.)',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'Full-scale compliance for regulated operations',
    features: [
      'Unlimited users',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'Advanced security',
      'Dedicated onboarding & implementation support',
      'Regulatory export & reporting',
      'Enterprise SSO & MFA',
    ],
  },
];

export default function PricingPage() {
  return (
    <div>
      <PricingHero />

      {/* Pricing Plans */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`bg-background border rounded-xl p-8 relative ${
                  plan.popular
                    ? 'border-primary scale-105 ring-1 ring-primary/20'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-1">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.period}
                  </div>
                  <p className="text-sm text-foreground/80 mt-4">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.name === 'Enterprise'
                      ? '/contact'
                      : `${appBase}/auth/signup`
                  }
                  className={`w-full block text-center px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {plan.name === 'Enterprise'
                    ? 'Contact Sales'
                    : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy/Backup Page: Do not deploy. Trial language updated for accuracy. */}
      <MarketingAnchor
        title="Ready to transform compliance?"
        subtitle="Start your free trial today. No credit card required. All onboarding uses real organization data, with no sample/demo content."
        badge="Get Started"
      />
    </div>
  );
}
