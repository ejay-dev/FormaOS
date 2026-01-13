"use client";

import Link from "next/link";
import { DollarSign, Check, ArrowRight, Shield, Users, Target } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  InteractiveCard,
  ParticleField,
  GradientMesh,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";
import { MarketingAnchor } from "../components/marketing-anchor";

function PricingHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Clean system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <CleanSystemGrid />
      </div>
      
      {/* Pulsing nodes - hidden on mobile */}
      <div className="hidden sm:block">
        <PulsingNode x="15%" y="25%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="85%" y="35%" delay={0.5} />
        <PulsingNode x="20%" y="75%" delay={1} />
        <PulsingNode x="80%" y="85%" delay={1.5} color="rgb(6, 182, 212)" />
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
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
              Simple pricing for<br />
              <span className="relative">
                <span className="text-gradient">compliance teams</span>
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
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10"
            >
              Start free, scale as you grow. No setup fees, no hidden costs, cancel anytime. Built for teams serious about compliance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/contact" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

export default function PricingPageContent() {
  return (
    <div>
      <PricingHero />

      <VisualDivider />

      {/* Pricing Tiers */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={25} 
            colors={["rgba(0, 212, 251, 0.3)", "rgba(139, 92, 246, 0.25)"]}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Choose Your Plan"
            title={<>Start free, upgrade<br className="hidden sm:inline" /><span className="text-gradient">when you're ready</span></>}
            subtitle="All plans include core compliance features with transparent, per-user pricing"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Starter Plan */}
            <InteractiveCard 
              glowColor="rgba(139, 92, 246, 0.1)"
              className="p-8 text-center"
            >
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-1">Free</div>
              <p className="text-sm text-foreground/70 mb-6">Up to 3 users</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Policy management with version control</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Task management and assignment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Evidence storage (1GB)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Basic audit trails</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Community support</span>
                </div>
              </div>
              
              <Link 
                href="/auth/signup" 
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Get Started Free
              </Link>
            </InteractiveCard>

            {/* Professional Plan */}
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.2)"
              className="p-8 text-center border-2 border-primary"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-1">$49</div>
              <p className="text-sm text-foreground/70 mb-6">Per user per month</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Everything in Starter</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Unlimited users</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Advanced evidence storage (50GB)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Framework alignment (NDIS, ISO 27001)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Custom reporting dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Priority email support</span>
                </div>
              </div>
              
              <Link 
                href="/auth/signup" 
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Start 14-Day Trial
              </Link>
            </InteractiveCard>

            {/* Enterprise Plan */}
            <InteractiveCard 
              glowColor="rgba(20, 184, 166, 0.1)"
              className="p-8 text-center"
            >
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-1">Custom</div>
              <p className="text-sm text-foreground/70 mb-6">Contact for pricing</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Everything in Professional</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Unlimited evidence storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Custom integrations & API</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Multi-tenant organization management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Dedicated customer success manager</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>24/7 phone & chat support</span>
                </div>
              </div>
              
              <Link 
                href="/contact" 
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </InteractiveCard>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* All Plans Include */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="All Plans Include"
            title={<>Security and compliance<br className="hidden sm:inline" /><span className="text-gradient">built into every tier</span></>}
            subtitle="Enterprise-grade features included from day one"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Enterprise Security"
              description="AES-256 encryption, SOC 2 compliance, and multi-factor authentication for all users"
              delay={0}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Role-Based Access"
              description="Granular permissions system with audit trails for every access and modification"
              delay={0.1}
            />
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Audit Readiness"
              description="Immutable audit trails and evidence management designed for regulatory examinations"
              delay={0.2}
            />
          </div>

          <InteractiveCard 
            className="mt-12 sm:mt-16 text-center"
            glowColor="rgba(139, 92, 246, 0.2)"
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              No surprises, no hidden fees
            </h3>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Transparent pricing that scales with your team. All security, compliance, 
              and core features included in every plan.
            </p>
          </InteractiveCard>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* FAQ Section */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(139, 92, 246, 0.08)", "rgba(0, 212, 251, 0.06)", "rgba(20, 184, 166, 0.04)"]}
            className="opacity-50"
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Frequently Asked Questions"
            title={<>Everything you need<br className="hidden sm:inline" /><span className="text-gradient">to know</span></>}
            subtitle="Common questions about FormaOS pricing and plans"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Can I change plans anytime?</h4>
                <p className="text-foreground/80 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                  immediately and we'll prorate any billing adjustments.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Is there a setup fee?</h4>
                <p className="text-foreground/80 text-sm">
                  No setup fees, ever. You can start with our free Starter plan and upgrade 
                  when your team grows or needs additional features.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">What payment methods do you accept?</h4>
                <p className="text-foreground/80 text-sm">
                  We accept all major credit cards and can arrange invoicing for Enterprise customers. 
                  All transactions are processed securely through Stripe.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">How does data migration work?</h4>
                <p className="text-foreground/80 text-sm">
                  Our customer success team provides guided migration assistance for Enterprise 
                  customers. We also offer import tools and API access for bulk data transfer.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Can I cancel anytime?</h4>
                <p className="text-foreground/80 text-sm">
                  Yes, you can cancel your subscription at any time. Your data remains accessible 
                  for 30 days after cancellation to ensure smooth transitions.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Do you offer training?</h4>
                <p className="text-foreground/80 text-sm">
                  All plans include self-service resources. Professional and Enterprise plans 
                  include live onboarding sessions and ongoing training support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <MarketingAnchor 
          title="Ready to get started?"
          subtitle="Join teams building better compliance with FormaOS"
          badge="Start Free"
        />
      </CinematicSection>
    </div>
  );
}