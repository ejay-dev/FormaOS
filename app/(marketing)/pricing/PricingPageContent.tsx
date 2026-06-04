'use client';

import { CheckCircle2 } from 'lucide-react';
import { TrustBar } from '@/components/TrustBar';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { DepthSection } from '@/components/motion/DepthSection';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  FinalCTA,
  FAQSection,
  PlanFinder,
  PricingComparisonTable,
  PricingHero,
  PricingTiers,
} from './components';

/**
 * Scope explorer — replaces the old three-identical-card "How pricing
 * works" grid with an interactive recommender (PlanFinder). Priced by
 * compliance scope, not feature unlocks: the inputs map to real plan
 * limits and surface the tier your scope actually requires.
 */
function PlanScopeSection() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.035),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header — centered label flanked by hairlines */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              What shapes your plan
            </span>
            <span className="h-px w-10 bg-white/20" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Priced by compliance scope, not feature unlocks.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Answer four questions about how you operate. We&rsquo;ll point you to
            the tier your scope requires — every plan runs the same engine.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.05, 0.45]}>
          <PlanFinder />
        </ScrollReveal>
      </div>
    </section>
  );
}

/**
 * Cost context — manual compliance work vs. FormaOS. De-gimmicked to
 * sit on the shared base background with hairlines only.
 */
function CostOfNonCompliance() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12">
        {/* Header — left labelled rule */}
        <ScrollReveal variant="slideUp" range={[0, 0.35]} className="mb-12 max-w-2xl">
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-px w-8 bg-white/25" />
            <span>The math</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            One failed audit costs more than a year of FormaOS.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Pricing only makes sense measured against the manual work it
            replaces — evidence chasing, repeated reviews, escalation gaps, and
            late remediation.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="depthSlide" range={[0.05, 0.45]}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.015]">
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
                <div className="px-6 pt-5 pb-2 sm:py-5">
                  <span className="text-sm font-semibold text-white">
                    {item.label}
                  </span>
                </div>
                <div className="px-6 pb-2 sm:py-5">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">
                    Manual
                  </span>
                  <span className="text-sm text-slate-400">{item.manual}</span>
                </div>
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
        id is missing from the initial SSR HTML and the in-page anchor
        click had nothing to scroll to until the section was already on
        screen (audit row D-5). This div-with-id sits in the static HTML
        and matches the same anchor name so the browser can scroll to the
        deferred section, which then mounts via the observer.
      */}
      <div id="pricing-table" className="scroll-mt-24" />
      <DeferredSection minHeight={600}>
        <DepthSection fade>
          <PricingTiers />
        </DepthSection>
      </DeferredSection>

      {/* Scope explorer → recommended plan */}
      <DeferredSection minHeight={520}>
        <DepthSection fade>
          <PlanScopeSection />
        </DepthSection>
      </DeferredSection>

      {/* Capability comparison (plan-focusable) */}
      <DeferredSection minHeight={500}>
        <PricingComparisonTable />
      </DeferredSection>

      {/* Cost context */}
      <DeferredSection minHeight={440}>
        <DepthSection fade>
          <CostOfNonCompliance />
        </DepthSection>
      </DeferredSection>

      {/* FAQ */}
      <DeferredSection minHeight={460}>
        <FAQSection />
      </DeferredSection>

      {/* Final CTA */}
      <DeferredSection minHeight={380}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
