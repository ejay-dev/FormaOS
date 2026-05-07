'use client';

import {
  CheckCircle2,
  ClipboardCheck,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrustBar } from '@/components/TrustBar';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { DepthSection } from '@/components/motion/DepthSection';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { CircuitPattern } from '@/components/marketing/SectionBackgrounds';
import {
  FinalCTA,
  FAQSection,
  PricingComparisonTable,
  PricingHero,
  PricingTiers,
} from './components';

const pricingSteps = [
  {
    icon: ClipboardCheck,
    title: 'We assess your compliance requirements',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope.',
  },
  {
    icon: Settings2,
    title: 'We configure enforced workflows',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails.',
  },
  {
    icon: ShieldCheck,
    title: 'Your system runs continuously',
    body: 'FormaOS stays always on in the background and generates evidence as work happens.',
  },
];

function CostOfNonCompliance() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#07111f] to-[#0a0f1c]">
        <CircuitPattern />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(245,158,11,0.06),transparent_40%)]" />
      </div>
      {/* Top divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <ScrollReveal variant="slideUp" range={[0, 0.4]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Cost Context
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              One failed audit can cost more than{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                a year of FormaOS
              </span>
            </h2>
            <p className="text-base leading-7 text-slate-400">
              Pricing only makes sense when it is measured against the manual
              work it replaces: evidence chasing, repeated reviews, escalation
              gaps, and remediation when issues are found late.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="depthSlide" range={[0.05, 0.45]}>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] backdrop-blur-sm bg-white/[0.03]">
              <div className="grid grid-cols-[1fr_1fr] border-b border-white/[0.08] text-sm font-semibold uppercase tracking-[0.16em]">
                <div className="px-5 py-4 text-red-200">Without FormaOS</div>
                <div className="px-5 py-4 text-emerald-200">With FormaOS</div>
              </div>
              {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[1fr_1fr] border-b border-white/[0.06] last:border-b-0"
                >
                  <div className="px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{item.manual}</p>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      System enforced
                    </p>
                    <p className="mt-2 text-sm text-emerald-200">
                      {item.formaos}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function HowPricingWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111f] via-[#0d1424] to-[#07111f]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(6,182,212,0.08),transparent_40%)]" />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { scale: [1, 1.2, 1], opacity: [0.06, 0.14, 0.06] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 12, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute bottom-1/4 right-1/4 h-1/3 w-1/3 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl"
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto max-w-3xl text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            How Pricing Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Priced by compliance scope,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              not feature unlocks
            </span>
          </h2>
          <p className="text-base leading-7 text-slate-400">
            Your plan is shaped by frameworks, sites, evidence volume, workflow
            complexity, and the level of support required to keep the system
            operating well.
          </p>
        </ScrollReveal>

        <SectionChoreography
          pattern="cascade"
          stagger={0.07}
          className="grid gap-4 md:grid-cols-3 mb-8"
        >
          {pricingSteps.map((step, index) => (
            <motion.article
              key={step.title}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-white/[0.08] backdrop-blur-sm bg-white/[0.04] p-6 hover:border-white/[0.14] transition-colors duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                <step.icon
                  className="h-5 w-5 text-cyan-200"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {step.body}
              </p>
            </motion.article>
          ))}
        </SectionChoreography>

        <ScrollReveal variant="fadeUp" range={[0.1, 0.5]}>
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5 text-sm leading-6 text-slate-300">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            Pricing scales based on your compliance scope and organisational
            complexity — not arbitrary feature gates.
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white pricing-page-flow">
      {/* Hero — full-viewport with HeroAtmosphere */}
      <PricingHero />

      <TrustBar />

      {/* Pricing tiers */}
      <DeferredSection minHeight={600}>
        <DepthSection fade>
          <PricingTiers />
        </DepthSection>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Comparison table */}
      <DeferredSection minHeight={500}>
        <PricingComparisonTable />
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Cost context */}
      <DeferredSection minHeight={440}>
        <DepthSection fade>
          <CostOfNonCompliance />
        </DepthSection>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* How pricing works */}
      <DeferredSection minHeight={400}>
        <DepthSection fade>
          <HowPricingWorks />
        </DepthSection>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* FAQ */}
      <DeferredSection minHeight={460}>
        <FAQSection />
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Final CTA */}
      <DeferredSection minHeight={380}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
