'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PUBLIC_PRICING_TIERS,
  nameFor,
  priceLabelFor,
} from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { duration } from '@/config/motion';

const TIER_VISUAL = {
  foundation: {
    code: 'FND',
    accent: 'text-zinc-400',
    rail: 'from-zinc-500/30 via-zinc-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-zinc-300',
  },
  growth: {
    code: 'GRW',
    accent: 'text-zinc-200',
    rail: 'from-white/60 via-white/20 to-transparent',
    chip: 'border-white/25 bg-white/[0.1] text-white',
  },
  scale: {
    code: 'SCL',
    accent: 'text-zinc-400',
    rail: 'from-zinc-500/30 via-zinc-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-zinc-300',
  },
  enterprise: {
    code: 'ENT',
    accent: 'text-zinc-400',
    rail: 'from-zinc-500/30 via-zinc-500/10 to-transparent',
    chip: 'border-white/[0.12] bg-white/[0.04] text-zinc-300',
  },
} as const;

export function PricingTiers() {
  const { trackCtaClick } = useMarketingTelemetry();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/*
        The `id="pricing-table"` anchor that the hero's "View pricing"
        CTA targets lives on a sibling div in PricingPageContent, see
        the comment there. Putting it on this section directly would
        not work because this component is rendered behind a deferred
        IntersectionObserver and the id would not be in SSR HTML.
      */}
      {/* Subtle white radial + hairlines (matches homepage exemplars) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.035),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header, labelled rule + paired descriptor */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mb-14 grid gap-x-12 gap-y-5 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-end"
        >
          <div>
            <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-zinc-500">
              <span className="h-px w-8 bg-white/25" />
              <span>Plan catalog</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              One compliance OS, four ways to deploy it.
            </h2>
          </div>
          <p className="text-sm leading-7 text-zinc-400 lg:pb-1">
            Foundation, Growth, and Scale are self-serve via Stripe. Enterprise
            is contracted with procurement and security review. Same engine
            across every plan. Only the scope changes. Prices in AUD, GST
            inclusive, billed monthly.
          </p>
        </ScrollReveal>

        {/* Tier grid */}
        <SectionChoreography
          pattern="cascade"
          stagger={0.07}
          className="grid items-stretch gap-5 lg:grid-cols-4"
        >
          {PUBLIC_PRICING_TIERS.map((tier) => {
            const visual = TIER_VISUAL[tier.id];
            const price = priceLabelFor(tier);
            const isCustomPrice = !price.startsWith('$');

            return (
              <motion.article
                key={tier.id}
                whileHover={
                  shouldReduceMotion ? undefined : { y: -4 }
                }
                transition={{ duration: duration.fast }}
                className={`group relative flex min-h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-b shadow-2xl ${
                  tier.featured
                    ? 'border-white/25 from-white/[0.07] via-white/[0.02] to-white/[0.02] shadow-zinc-950/50 lg:-mt-4 lg:mb-4 lg:scale-[1.015]'
                    : 'border-white/[0.07] from-white/[0.045] to-white/[0.015] shadow-zinc-950/50 hover:border-white/[0.14]'
                }`}
              >
                {/* Vertical accent rail */}
                <span
                  className={`pointer-events-none absolute inset-y-6 left-0 w-px bg-gradient-to-b ${visual.rail}`}
                />

                {/* Body */}
                <div className="flex flex-1 flex-col px-6 pb-6 pt-7">
                  {/* Badge row (reserved height keeps card tops aligned) */}
                  <div className="mb-4 flex h-5 items-center">
                    {tier.badge ? (
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${visual.chip}`}
                      >
                        {tier.badge}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    {nameFor(tier)}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-snug text-zinc-400">
                    {tier.audience}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-500">
                    {tier.audienceSize}
                  </p>

                  {/* Price */}
                  <div className="mt-7">
                    <div className="flex items-end gap-2">
                      <span
                        className={`font-semibold tracking-tight text-white ${
                          isCustomPrice ? 'text-4xl' : 'text-5xl'
                        }`}
                      >
                        {price}
                      </span>
                      {!isCustomPrice ? (
                        <span className="pb-2 text-sm font-medium text-zinc-400">
                          {tier.priceSubtext}
                        </span>
                      ) : null}
                    </div>
                    {isCustomPrice ? (
                      <p className="mt-1 text-sm font-medium text-zinc-400">
                        {tier.priceSubtext}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-zinc-400">
                    <CheckCircle2
                      className={`mt-0.5 h-3 w-3 shrink-0 ${
                        tier.featured ? 'text-zinc-200' : 'text-zinc-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{tier.trustNote}</span>
                  </div>

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
                        ? 'bg-white text-zinc-900 shadow-lg shadow-zinc-950/40 hover:bg-zinc-100'
                        : 'border border-white/[0.1] bg-white/[0.04] text-white hover:border-white/[0.2] hover:bg-white/[0.08]'
                    }`}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {/* Summary */}
                  <p className="mt-6 text-[13px] leading-relaxed text-zinc-400">
                    {tier.summary}
                  </p>

                  {/* Features ledger */}
                  <div className="mt-6 border-t border-white/[0.06] pt-5">
                    <p className="text-[10px] text-zinc-500">
                      Includes
                    </p>
                    <ul className="mt-3 flex-1 space-y-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex gap-2.5 text-[13px] leading-snug text-zinc-300"
                        >
                          <CheckCircle2
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                              tier.featured
                                ? 'text-zinc-200'
                                : 'text-zinc-400'
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
          <p className="text-[10px] text-zinc-500">
            Prices in AUD · GST inclusive · Stripe-secured payments
          </p>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500">
            <span>SSO available on Enterprise</span>
            <span className="text-zinc-600">·</span>
            <span>Cancel anytime</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
