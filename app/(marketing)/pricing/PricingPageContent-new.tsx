'use client';

import Link from 'next/link';
import {
  DollarSign,
  Check,
  ArrowRight,
  Shield,
  Users,
  Target,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  GradientMesh,
} from '@/components/motion';
import {
  CleanSystemGrid,
  PulsingNode,
  ParallaxLayer,
} from '@/components/motion/CleanBackground';
import { MarketingAnchor } from '../components/marketing-anchor';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


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
              Install the OS.
              <br />
              <span className="relative">
                <span className="text-gradient">Scale with confidence.</span>
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
              All plans include the complete FormaOS compliance engine.
              Transparent pricing. No hidden costs. Full OS capabilities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link
                href={`${appBase}/auth/signup?plan=pro`}
                className="w-full sm:w-auto btn btn-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto btn btn-ghost px-6 py-3 text-sm font-semibold leading-6 flex items-center justify-center sm:justify-start gap-2"
              >
                Contact Sales <ArrowRight className="h-4 w-4" />
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
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Choose Your Plan"
            title={
              <>
                Start strong, scale
                <br className="hidden sm:inline" />
                <span className="text-gradient">with confidence</span>
              </>
            }
            subtitle="All plans include the FormaOS compliance engine with transparent monthly pricing"
            alignment="center"
          />

          {/* Enhanced Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* FormaOS Starter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.10] to-white/[0.02] rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:border-primary/30 hover:from-primary/[0.05] hover:to-primary/[0.01] text-center">
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    FormaOS Starter
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gradient">
                      $159
                    </span>
                    <span className="text-lg text-foreground/70 ml-2">
                      / month
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10">
                    For small teams building structured compliance foundations
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Core policy & control management</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Task assignment & accountability tracking</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Evidence capture with audit trail</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Single organization workspace</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Standard reporting dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Email support</span>
                  </div>
                </div>

                <Link
                  href={`${appBase}/auth/signup?plan=basic`}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-2xl border-2 border-primary/30 text-primary font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm bg-white/[0.02]"
                >
                  Start Free Trial
                </Link>
              </div>
            </motion.div>

            {/* FormaOS Pro - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ y: -12, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.15] to-white/[0.05] rounded-3xl p-8 border-2 border-primary/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:border-primary/50 hover:from-primary/[0.08] hover:to-primary/[0.02] text-center">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="backdrop-blur-xl bg-gradient-to-r from-primary to-secondary px-6 py-2 rounded-full text-xs font-bold text-white shadow-lg border border-white/20">
                    Most Popular
                  </div>
                </div>

                {/* Plan Header */}
                <div className="mb-8 pt-4">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    FormaOS Pro
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gradient">
                      $239
                    </span>
                    <span className="text-lg text-foreground/70 ml-2">
                      / month
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10">
                    For organizations operationalizing compliance across teams
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Everything in Starter</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Multi-user team management</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Advanced evidence management</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>
                      Framework alignment (NDIS, ISO, internal governance)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Operational dashboards & compliance metrics</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Priority support</span>
                  </div>
                </div>

                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="w-full inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
              </div>
            </motion.div>

            {/* FormaOS Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.10] to-white/[0.02] rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:border-accent/30 hover:from-accent/[0.05] hover:to-accent/[0.01] text-center">
                {/* Enterprise Badge */}
                <div className="absolute top-4 right-4">
                  <div className="backdrop-blur-xl bg-gradient-to-r from-accent/20 to-accent/10 px-3 py-1 rounded-full text-xs font-semibold text-accent border border-accent/20">
                    Enterprise
                  </div>
                </div>

                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-accent transition-colors duration-300">
                    FormaOS Enterprise
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gradient">
                      Custom
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10">
                    Contact for pricing
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>Multi-tenant architecture</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>Custom frameworks & policy mapping</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>Advanced integrations & API access</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>Dedicated compliance success manager</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>SLA-backed support</span>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-accent/30 text-accent font-semibold hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 backdrop-blur-sm bg-white/[0.02]"
                >
                  Talk to Sales <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* All Plans Include */}
      <CinematicSection
        backgroundType="nodes"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="All Plans Include"
            title={
              <>
                Enterprise-grade
                <br className="hidden sm:inline" />
                <span className="text-gradient">foundation features</span>
              </>
            }
            subtitle="Security, compliance, and operational excellence built into every tier"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Australian-hosted infrastructure"
              description="Data sovereignty and compliance with local privacy laws, hosted in secure Australian data centers"
              delay={0}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Audit-ready by design"
              description="Immutable evidence trails, automated reporting, and regulatory examination support built-in"
              delay={0.1}
            />
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Upgrade or cancel anytime"
              description="Flexible billing with no long-term commitments. Scale up or down as your organization evolves"
              delay={0.2}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-12 sm:mt-16 text-center"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.10] to-white/[0.02] rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gradient">
                Transparent pricing, no surprises
              </h3>
              <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
                All plans include the FormaOS compliance engine with transparent
                monthly pricing. No setup fees, no hidden costs, no long-term
                contracts.
              </p>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* FAQ Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh
            colors={[
              'rgba(139, 92, 246, 0.08)',
              'rgba(0, 212, 251, 0.06)',
              'rgba(20, 184, 166, 0.04)',
            ]}
            className="opacity-50"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Frequently Asked Questions"
            title={
              <>
                Everything you need
                <br className="hidden sm:inline" />
                <span className="text-gradient">to know</span>
              </>
            }
            subtitle="Common questions about FormaOS pricing and plans"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Can I change plans anytime?
                </h4>
                <p className="text-foreground/80 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately and we'll prorate any billing
                  adjustments.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Is there a setup fee?
                </h4>
                <p className="text-foreground/80 text-sm">
                  No setup fees, ever. You can start with our free Starter plan
                  and upgrade when your team grows or needs additional features.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">
                  What payment methods do you accept?
                </h4>
                <p className="text-foreground/80 text-sm">
                  We accept all major credit cards and can arrange invoicing for
                  Enterprise customers. All transactions are processed securely
                  through Stripe.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  How does data migration work?
                </h4>
                <p className="text-foreground/80 text-sm">
                  Our customer success team provides guided migration assistance
                  for Enterprise customers. We also offer import tools and API
                  access for bulk data transfer.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Can I cancel anytime?
                </h4>
                <p className="text-foreground/80 text-sm">
                  Yes, you can cancel your subscription at any time. Your data
                  remains accessible for 30 days after cancellation to ensure
                  smooth transitions.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Do you offer training?
                </h4>
                <p className="text-foreground/80 text-sm">
                  All plans include self-service resources. Professional and
                  Enterprise plans include live onboarding sessions and ongoing
                  training support.
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
        className="py-16 sm:py-20 lg:py-24 relative"
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
