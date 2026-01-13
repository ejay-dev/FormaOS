"use client";

import Link from "next/link";
import { Sparkles, Zap, Shield, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  PricingTierCard,
  EnterprisePricingCard,
  CinematicSection,
  SectionHeader,
  VisualDivider,
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
  ParticleField,
  GradientMesh,
  InteractiveCard,
} from "@/components/motion";

export function PricingHero() {
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
        <PulsingNode x="10%" y="20%" delay={0} />
        <PulsingNode x="90%" y="30%" delay={0.5} color="rgb(139, 92, 246)" />
        <PulsingNode x="15%" y="70%" delay={1} color="rgb(6, 182, 212)" />
        <PulsingNode x="85%" y="80%" delay={1.5} />
      </div>
      
      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-primary/20 blur-[60px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[250px] sm:h-[500px] w-[250px] sm:w-[500px] rounded-full bg-secondary/15 blur-[50px] sm:blur-[100px]" />
      
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
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-primary/30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </motion.div>
              Simple, Transparent Pricing
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Plans built for<br />
              <span className="relative">
                <span className="text-gradient">growing compliance teams</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8"
            >
              Choose the level of governance and support your organization requires. 
              Start with a 14-day free trial—no payment details needed.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-xs sm:text-sm text-muted-foreground"
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
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(0, 212, 251, 0.08)", "rgba(139, 92, 246, 0.06)", "rgba(20, 184, 166, 0.04)"]}
            className="opacity-50"
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
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
        className="py-16 sm:py-20 lg:py-32"
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
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Included in All Plans"
            title={<>Enterprise-grade infrastructure<br className="hidden sm:inline" /><span className="text-gradient">from day one</span></>}
            subtitle="Every plan includes the core platform capabilities needed for audit-ready operations"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
              <InteractiveCard 
                key={group.title} 
                delay={idx * 0.1}
                glowColor="rgba(20, 184, 166, 0.2)"
              >
                <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4 sm:mb-6">
                  <group.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold font-display mb-3 sm:mb-4">{group.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* FAQ Section */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Frequently Asked Questions"
            title={<>Pricing questions</>}
            alignment="center"
          />

          <div className="space-y-4 sm:space-y-6">
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
              <InteractiveCard 
                key={idx}
                delay={idx * 0.05}
                glowColor="rgba(0, 212, 251, 0.15)"
              >
                <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3">{faq.q}</h3>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">{faq.a}</p>
              </InteractiveCard>
            ))}
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <p className="text-foreground/70 mb-4 sm:mb-6">Still have questions?</p>
            <Link 
              href="/contact" 
              className="group inline-flex items-center gap-2 btn btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5"
            >
              Contact Sales
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </CinematicSection>
    </>
  );
}
