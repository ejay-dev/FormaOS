'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { TopographicPattern } from '@/components/marketing/SectionBackgrounds';
import { duration } from '@/config/motion';

const TIER_VISUAL = {
  foundation: {
    code: 'FND',
    accent: 'text-slate-400',
    rail: 'from-slate-500/30 via-slate-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-slate-300',
  },
  growth: {
    code: 'GRW',
    accent: 'text-emerald-300',
    rail: 'from-emerald-300/70 via-emerald-300/20 to-transparent',
    chip: 'border-emerald-300/40 bg-emerald-300/[0.12] text-emerald-100',
  },
  scale: {
    code: 'SCL',
    accent: 'text-slate-400',
    rail: 'from-slate-500/30 via-slate-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-slate-300',
  },
  enterprise: {
    code: 'ENT',
    accent: 'text-slate-400',
    rail: 'from-slate-500/30 via-slate-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-slate-300',
  },
} as const;

export function PricingTiers() {
  const { trackCtaClick } = useMarketingTelemetry();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="pricing-table"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Section backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <TopographicPattern color="rgba(20,184,166,0.04)" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent_55%)]" />
      </div>

      {/* Top + bottom hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              <span className="h-px w-6 bg-white/20" />
              <span className="text-slate-300">Plan catalog</span>
              <span className="text-slate-600">·</span>
              <span>4 tiers · 1 architecture</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              One compliance OS, four ways to deploy it.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Foundation, Growth, and Scale are self-serve via Stripe. Enterprise
              is contracted with procurement and security review. Same
              compliance engine across every plan — only scope changes.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/[0.06] bg-black/30 px-5 py-4 backdrop-blur-md lg:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Currency
            </p>
            <p className="mt-1.5 font-mono text-sm text-white">AUD · GST inc.</p>
            <div className="mt-3 h-px bg-gradient-to-r from-white/10 to-transparent" />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Billing
            </p>
            <p className="mt-1.5 font-mono text-sm text-white">Monthly · Stripe</p>
          </div>
        </ScrollReveal>

        {/* Tier grid */}
        <SectionChoreography
          pattern="cascade"
          stagger={0.07}
          className="grid items-stretch gap-5 lg:grid-cols-4"
        >
          {PUBLIC_PRICING_TIERS.map((tier, index) => {
            const visual = TIER_VISUAL[tier.id];
            const number = String(index + 1).padStart(2, '0');

            return (
              <motion.article
                key={tier.id}
                whileHover={
                  shouldReduceMotion ? undefined : { y: -4 }
                }
                transition={{ duration: duration.fast }}
                className={`group relative flex min-h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-b shadow-2xl ${
                  tier.featured
                    ? 'border-emerald-300/40 from-emerald-300/[0.07] via-emerald-300/[0.02] to-white/[0.02] shadow-emerald-950/40 lg:-mt-4 lg:mb-4 lg:scale-[1.015]'
                    : 'border-white/[0.07] from-white/[0.045] to-white/[0.015] shadow-slate-950/50 hover:border-white/[0.14]'
                }`}
              >
                {/* Vertical accent rail */}
                <span
                  className={`pointer-events-none absolute inset-y-6 left-0 w-px bg-gradient-to-b ${visual.rail}`}
                />

                {/* Header strip */}
                <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      Tier {number}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.22em] ${visual.accent}`}
                    >
                      / {visual.code}
                    </span>
                  </div>
                  {tier.badge ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${visual.chip}`}
                    >
                      {tier.badge}
                    </span>
                  ) : null}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col px-6 pt-6 pb-6">
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-snug text-slate-400">
                    {tier.audience}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {tier.audienceSize}
                  </p>

                  {/* Price */}
                  <div className="mt-7 flex items-end gap-2">
                    <span className="font-mono text-5xl font-semibold tracking-tight text-white">
                      {tier.priceLabel}
                    </span>
                    <span className="pb-2 text-sm font-medium text-slate-400">
                      {tier.priceSubtext}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {tier.trustNote}
                  </p>

                  {/* CTA */}
                  <Link
                    href={tier.ctaHref}
                    data-testid={`pricing-${tier.id}-cta`}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'pricing',
                        section: 'tiers',
                        location: 'pricing_card',
                        ctaLabel: tier.ctaLabel,
                        ctaHref: tier.ctaHref,
                        variant: tier.featured ? 'primary' : 'plan',
                        plan: tier.id,
                      })
                    }
                    className={`mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      tier.featured
                        ? 'bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-950/40 hover:bg-emerald-300'
                        : 'border border-white/[0.1] bg-white/[0.04] text-white hover:border-white/[0.2] hover:bg-white/[0.08]'
                    }`}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {/* Summary */}
                  <p className="mt-6 text-[13px] leading-relaxed text-slate-400">
                    {tier.summary}
                  </p>

                  {/* Features ledger */}
                  <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Includes
                    </p>
                    <ul className="mt-3 flex-1 space-y-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex gap-2.5 text-[13px] leading-snug text-slate-300"
                        >
                          <CheckCircle2
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                              tier.featured
                                ? 'text-emerald-300'
                                : 'text-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </SectionChoreography>

        {/* Footer notes */}
        <ScrollReveal
          variant="fadeUp"
          range={[0, 0.4]}
          className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Prices in AUD · GST inclusive · Stripe-secured payments
          </p>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <span>SSO available on Enterprise</span>
            <span className="text-slate-600">·</span>
            <span>Cancel anytime</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
