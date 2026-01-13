"use client";

import Link from "next/link";
import { Sparkles, Zap, Shield, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { 
  PricingTierCard,
  EnterprisePricingCard,
  CinematicSection,
  SectionHeader,
  VisualDivider,
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer
} from "@/components/motion";

export function PricingHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-60">
        <AnimatedSystemGrid />
      </div>
      
      {/* Pulsing nodes */}
      <PulsingNode x="10%" y="20%" delay={0} />
      <PulsingNode x="90%" y="30%" delay={0.5} color="rgb(139, 92, 246)" />
      <PulsingNode x="15%" y="70%" delay={1} color="rgb(6, 182, 212)" />
      <PulsingNode x="85%" y="80%" delay={1.5} />
      
      {/* Radial gradient overlays */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[80px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
        <ParallaxLayer speed={0.3}>
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 glass-intense rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider mb-8 border border-primary/30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
              Simple, Transparent Pricing
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6"
            >
              Plans built for<br />
              <span className="relative">
                <span className="text-gradient">growing compliance teams</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8"
            >
              Choose the level of governance and support your organization requires. 
              Start with a 14-day free trial—no payment details needed.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-sm text-muted-foreground"
            >
              All pricing in AUD · Billed monthly · Cancel anytime
            </motion.p>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

const tiers = [
  {
    name: "Starter",
    price: "$159 AUD",
    cadence: "/month",
    description: "For small providers and solo operators running essential compliance workflows.",
    features: [
      "Core compliance engine",
      "Tasks and evidence management",
      "Audit logs and immutable history",
      "Standard reporting and exports",
      "Email support",
      "14-day free trial"
    ],
    cta: "Start Trial",
    href: "/auth/signup?plan=basic",
    featured: false
  },
  {
    name: "Pro",
    price: "$230 AUD",
    cadence: "/month",
    description: "For growing organizations operating across sites and teams.",
    features: [
      "Everything in Starter",
      "Advanced reporting and analytics",
      "Governance controls and workflows",
      "Operational dashboards",
      "Workflow automation",
      "Priority support",
      "14-day free trial"
    ],
    cta: "Start Trial",
    href: "/auth/signup?plan=pro",
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "For organizations seeking full implementation and white-glove support.",
    features: [
      "Everything in Pro",
      "White-glove onboarding",
      "Custom compliance frameworks",
      "Org-wide deployment support",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom integrations"
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false
  }
];

export function PricingContent() {
  return (
    <>
      {/* Pricing tiers */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, idx) => (
              <PricingTierCard
                key={tier.name}
                name={tier.name}
                price={tier.price}
                cadence={tier.cadence}
                description={tier.description}
                features={tier.features}
                cta={tier.cta}
                href={tier.href}
                featured={tier.featured}
                delay={idx * 0.15}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Enterprise CTA */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <EnterprisePricingCard delay={0} />
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Value props */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="accent"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Included in All Plans"
            title={<>Enterprise-grade infrastructure<br /><span className="text-gradient">from day one</span></>}
            subtitle="Every plan includes the core platform capabilities needed for audit-ready operations"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Security & Compliance",
                items: ["Role-based access control", "Immutable audit logs", "Evidence encryption", "SOC 2 Type II infrastructure"]
              },
              {
                icon: Zap,
                title: "Platform Capabilities",
                items: ["Unlimited evidence storage", "Real-time dashboards", "Mobile access", "API access"]
              },
              {
                icon: Crown,
                title: "Support & Success",
                items: ["Knowledge base access", "Video tutorials", "Email support", "Community forum"]
              }
            ].map((group, idx) => (
              <div key={group.title} className="glass-panel rounded-2xl p-8">
                <div className="rounded-xl bg-primary/10 p-3 w-fit mb-6">
                  <group.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-display mb-4">{group.title}</h3>
                <ul className="space-y-3">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* FAQ Section */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Frequently Asked Questions"
            title={<>Pricing questions</>}
            alignment="center"
          />

          <div className="space-y-6">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle."
              },
              {
                q: "What happens after the trial?",
                a: "Your trial converts to the paid plan you selected. You'll receive a reminder email before billing starts. No credit card required for trial."
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes. Contact sales for annual pricing options with additional discounts."
              },
              {
                q: "What's included in white-glove onboarding?",
                a: "Enterprise customers receive dedicated implementation support, custom framework setup, team training, and deployment assistance."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your billing settings. No long-term contracts required for Starter or Pro plans."
              }
            ].map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-8">
                <h3 className="text-lg font-semibold font-display mb-3">{faq.q}</h3>
                <p className="text-foreground/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-foreground/70 mb-6">Still have questions?</p>
            <Link href="/contact" className="btn btn-primary text-lg px-10 py-5">
              Contact Sales
            </Link>
          </div>
        </div>
      </CinematicSection>
    </>
  );
}
