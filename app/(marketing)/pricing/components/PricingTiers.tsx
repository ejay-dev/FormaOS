'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { TopographicPattern } from '@/components/marketing/SectionBackgrounds';
import { duration } from '@/config/motion';

const BADGE_TONES = {
  popular: 'border-emerald-300/40 bg-emerald-300/[0.14] text-emerald-100',
  value: 'border-cyan-300/40 bg-cyan-300/[0.14] text-cyan-100',
  enterprise: 'border-violet-300/40 bg-violet-300/[0.14] text-violet-100',
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
        <TopographicPattern color="rgba(16,185,129,0.035)" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.14),transparent_40%)]" />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 14, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-1/3 w-1/3 rounded-full bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto max-w-3xl text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Infrastructure pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            One compliance OS,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              four ways to scale it
            </span>
          </h2>
          <p className="text-base leading-7 text-slate-400">
            Start on Foundation and grow into Scale as your network expands.
            Foundation, Growth, and Scale are self-serve — no sales call
            required. Enterprise is contracted with procurement and security
            review.
          </p>
        </ScrollReveal>

        <SectionChoreography
          pattern="cascade"
          stagger={0.06}
          className="grid items-stretch gap-5 lg:grid-cols-4"
        >
          {PUBLIC_PRICING_TIERS.map((tier) => {
            const tone = tier.badgeTone ?? 'value';
            const badgeClass = BADGE_TONES[tone];

            return (
              <motion.article
                key={tier.id}
                whileHover={
                  shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }
                }
                transition={{ duration: duration.fast }}
                className={`relative flex min-h-full flex-col rounded-[2rem] border p-6 shadow-2xl cursor-default ${
                  tier.featured
                    ? 'border-emerald-300/40 bg-gradient-to-b from-emerald-300/[0.1] to-emerald-300/[0.04] shadow-emerald-950/40 lg:-mt-6 lg:mb-6 lg:scale-[1.02]'
                    : 'border-white/[0.08] bg-white/[0.045] shadow-slate-950/40 hover:border-white/[0.14] transition-colors duration-300'
                }`}
              >
                {tier.badge ? (
                  <span
                    className={`absolute right-6 top-6 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass}`}
                  >
                    {tone === 'popular' ? (
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                    ) : null}
                    {tier.badge}
                  </span>
                ) : null}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                  <ShieldCheck
                    className="h-5 w-5 text-cyan-200"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-6 text-2xl font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm leading-5 text-slate-300">
                  {tier.audience}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {tier.audienceSize}
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    {tier.priceLabel}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-400">
                    {tier.priceSubtext}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{tier.trustNote}</p>

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
                  className={`mt-6 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    tier.featured
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-950/40 hover:brightness-110'
                      : 'border border-white/[0.1] bg-white/[0.06] text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {tier.ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <p className="mt-6 text-sm leading-6 text-slate-400">
                  {tier.summary}
                </p>

                <ul className="mt-6 flex-1 space-y-3 border-t border-white/[0.06] pt-6">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm leading-6 text-slate-300"
                    >
                      <CheckCircle2
                        className="mt-1 h-4 w-4 shrink-0 text-emerald-300"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </SectionChoreography>

        <ScrollReveal
          variant="fadeUp"
          range={[0, 0.4]}
          className="mt-10 text-center"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Prices in AUD · GST inclusive · Stripe-secured payments
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
