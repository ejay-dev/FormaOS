'use client';

import { Check } from 'lucide-react';
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
  RoiCalculator,
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
            the tier your scope requires. Every plan runs the same engine.
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
 * Cost context. Header argument + an interactive ROI calculator
 * (the centerpiece), backed by a compact before/after fact strip drawn
 * from the real manual-cost anchors. Sits on the shared base bg.
 */
function CostOfNonCompliance() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
        {/* Header — left labelled rule */}
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="mb-12 max-w-2xl">
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-px w-8 bg-white/25" />
            <span>The math</span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
            Price it against the work it removes.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            Compliance run on spreadsheets is mostly labour: audit prep,
            evidence chasing, credential tracking. Set your scope and see what
            the manual version actually costs.
          </p>
        </ScrollReveal>

        {/* Interactive ROI calculator (centerpiece) */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.45]}>
          <RoiCalculator />
        </ScrollReveal>

        {/* Concrete before/after facts */}
        <ScrollReveal variant="fadeUp" range={[0.1, 0.5]}>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-slate-500 line-through decoration-slate-700/70">
                  {item.manual}
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-sm font-medium text-white">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden="true" />
                  <span>{item.formaos}</span>
                </p>
              </div>
            ))}
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
