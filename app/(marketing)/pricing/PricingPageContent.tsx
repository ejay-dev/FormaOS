'use client';

import {
  CheckCircle2,
  ClipboardCheck,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { TrustBar } from '@/components/TrustBar';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { DepthSection } from '@/components/motion/DepthSection';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { CircuitPattern } from '@/components/marketing/SectionBackgrounds';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  FinalCTA,
  FAQSection,
  PricingComparisonTable,
  PricingHero,
  PricingTiers,
} from './components';

const pricingSteps = [
  {
    code: 'A',
    icon: ClipboardCheck,
    title: 'Assess scope',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope.',
  },
  {
    code: 'B',
    icon: Settings2,
    title: 'Configure enforcement',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails.',
  },
  {
    code: 'C',
    icon: ShieldCheck,
    title: 'Operate continuously',
    body: 'FormaOS stays always on in the background and generates evidence as work happens.',
  },
];

function CostOfNonCompliance() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#07111f] to-[#0a0f1c]">
        <CircuitPattern />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(148,163,184,0.05),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(148,163,184,0.06),transparent_45%)]" />
      </div>
      {/* Top divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="h-px w-8 bg-white/25" />
            <span>Manual vs FormaOS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            One failed audit costs more than{' '}
            <span className="text-slate-400">
              a year of FormaOS.
            </span>
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Pricing only makes sense when measured against the manual work it
            replaces — evidence chasing, repeated reviews, escalation gaps, and
            late remediation.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="depthSlide" range={[0.05, 0.45]}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/50">
            {/* Column headers (desktop) */}
            <div className="hidden border-b border-white/[0.08] sm:grid sm:grid-cols-[1.1fr_1fr_1.15fr]">
              <div className="px-6 py-4" />
              <div className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Manual / pre-FormaOS
              </div>
              <div className="flex items-center gap-2 border-l border-white/[0.06] bg-white/[0.03] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-slate-300" aria-hidden="true" />
                With FormaOS
              </div>
            </div>

            {/* Rows */}
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item, idx) => (
              <div
                key={item.label}
                className={`grid grid-cols-1 sm:grid-cols-[1.1fr_1fr_1.15fr] ${
                  idx > 0 ? 'border-t border-white/[0.06]' : ''
                }`}
              >
                {/* Dimension */}
                <div className="px-6 pt-5 pb-2 sm:py-5">
                  <span className="text-sm font-semibold text-white">
                    {item.label}
                  </span>
                </div>
                {/* Manual */}
                <div className="px-6 pb-2 sm:py-5">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                    Manual
                  </span>
                  <span className="text-sm text-slate-400">{item.manual}</span>
                </div>
                {/* With FormaOS */}
                <div className="border-white/[0.06] bg-white/[0.02] px-6 pb-5 pt-1 sm:border-l sm:py-5 sm:pt-5">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
                    With FormaOS
                  </span>
                  <span className="text-sm font-medium text-white">
                    {item.formaos}
                  </span>
                </div>
              </div>
            ))}

            {/* Footer caption */}
            <div className="border-t border-white/[0.08] bg-white/[0.015] px-6 py-3.5 text-center text-xs text-slate-500">
              With FormaOS, evidence is captured continuously as work happens —
              not reconstructed before an audit.
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function HowPricingWorks() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111f] via-[#0d1424] to-[#07111f]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(161,161,170,0.06),transparent_50%)]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <span className="h-px w-6 bg-white/25" />
            <span className="text-slate-400">Pricing pipeline</span>
            <span className="text-slate-600">·</span>
            <span>3 stages</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Priced by compliance scope,{' '}
            <span className="text-foreground">
              not feature unlocks.
            </span>
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Your plan is shaped by frameworks, sites, evidence volume, workflow
            complexity, and the level of support required to keep the system
            operating well.
          </p>
        </ScrollReveal>

        {/* Pipeline rail */}
        <div className="relative">
          {/* Horizontal connector (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[72px] hidden md:block"
          >
            <div className="mx-auto h-px max-w-5xl bg-[image:linear-gradient(to_right,transparent,rgba(161,161,170,0.45)_25%,rgba(161,161,170,0.45)_50%,rgba(161,161,170,0.45)_75%,transparent)] [mask-image:linear-gradient(to_right,transparent_5%,black_15%,black_85%,transparent_95%)]" />
          </div>

          <SectionChoreography
            pattern="cascade"
            stagger={0.07}
            className="grid gap-5 md:grid-cols-3"
          >
            {pricingSteps.map((step, index) => (
              <article
                key={step.title}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 transition-colors duration-300 hover:border-white/[0.14]"
              >
                {/* Stage marker */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] text-sm text-slate-200">
                    {step.code}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Stage {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="ml-auto h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <step.icon
                    className="h-5 w-5 text-slate-300"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-400">
                  {step.body}
                </p>
              </article>
            ))}
          </SectionChoreography>
        </div>

        <ScrollReveal variant="fadeUp" range={[0.1, 0.5]}>
          <div className="mx-auto mt-10 flex max-w-3xl items-center gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent px-5 py-4 text-sm leading-6 text-slate-300">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Output
            </span>
            <span>
              Pricing scales with your compliance scope and operating
              complexity — not arbitrary feature gates.
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white pricing-page-flow">
      {/* Hero */}
      <div className="relative isolate overflow-hidden">
        <SectionMedia src="/marketing-media/pricing.jpg" objectPosition="50% 35%" opacity={0.5} scrim="center" />
        <PricingHero />
      </div>

      <TrustBar />

      {/* Pricing tiers */}
      {/*
        Stable anchor target for the hero's "View pricing" link. The
        <section id="pricing-table"> inside PricingTiers is rendered
        client-only via DeferredSection's IntersectionObserver, so the
        id is missing from the initial SSR HTML and the in-page
        anchor click had nothing to scroll to until the section was
        already on-screen (audit row D-5). This div-with-id sits in
        the static HTML and matches the same anchor name so the
        browser can scroll the user to the deferred section, which
        then mounts via the observer.
      */}
      <div id="pricing-table" className="scroll-mt-24" />
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
