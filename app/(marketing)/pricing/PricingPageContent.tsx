'use client';

import {
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
          <div className="mb-5 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <span className="h-px w-6 bg-white/25" />
            <span className="text-slate-400">Cost ledger</span>
            <span className="text-slate-600">·</span>
            <span>before / after FormaOS</span>
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
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0c1424]/90 via-[#070e1c]/85 to-[#040810]/90 shadow-2xl shadow-black/40 ring-1 ring-white/[0.03]">
            {/* Edge glow lines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            {/* Center divider */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent md:block" />
            {/* Corner accents */}
            <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/20" />
            <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/20" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/15" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/15" />

            {/* Rail headers */}
            <div className="grid grid-cols-1 border-b border-white/[0.06] md:grid-cols-2">
              <div className="flex items-center gap-3 px-6 py-4">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Manual / pre-FormaOS
                </span>
              </div>
              <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4 md:border-t-0 md:border-l">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-200">
                  System enforced
                </span>
              </div>
            </div>

            {/* Rows */}
            <ul>
              {MANUAL_COMPLIANCE_COST_ANCHORS.map((item, idx) => (
                <li
                  key={item.label}
                  className={`grid grid-cols-1 ${idx > 0 ? 'border-t border-white/[0.05]' : ''} md:grid-cols-2`}
                >
                  <div className="relative flex items-start gap-4 px-6 py-5">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1.5 text-sm text-slate-300">
                        {item.manual}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-4 border-t border-white/[0.04] px-6 py-5 md:border-t-0 md:border-l">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Enforced
                      </p>
                      <p className="mt-1.5 text-sm text-slate-200">
                        {item.formaos}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Bottom strip */}
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>cost-ledger.v2 · 4 anchors</span>
              <span className="flex items-center gap-2 text-slate-400">
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                evidence captured continuously
              </span>
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
          <div className="mb-5 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
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
                {/* Corner accents */}
                <span className="pointer-events-none absolute left-2.5 top-2.5 h-2.5 w-2.5 border-l border-t border-white/20" />
                <span className="pointer-events-none absolute right-2.5 top-2.5 h-2.5 w-2.5 border-r border-t border-white/15" />
                <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-2.5 w-2.5 border-b border-l border-white/15" />
                <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-2.5 w-2.5 border-b border-r border-white/20" />

                {/* Stage marker */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] font-mono text-sm text-slate-200">
                    {step.code}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
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
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
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
        <SectionMedia src="/marketing-media/pricing.jpg" objectPosition="50% 35%" opacity={0.85} scrim="center" />
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
