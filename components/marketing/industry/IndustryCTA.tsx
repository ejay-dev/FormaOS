'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import {
  compliancePlanHref,
  salesHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import {
  PUBLIC_PRICING_TIERS,
  nameFor,
  priceLabelFor,
} from '@/lib/marketing/pricing';

export interface IndustryCTAProps {
  industry: string;
  /** Optional urgency callout displayed above pricing */
  urgencyCallout?: string;
}

export function IndustryCTA({ industry, urgencyCallout }: IndustryCTAProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-[#080b14]" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.03] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          {urgencyCallout && (
            <div className="mb-8 mx-auto max-w-2xl rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-4">
              <p className="text-sm font-medium text-amber-300/90 leading-relaxed text-center">
                {urgencyCallout}
              </p>
            </div>
          )}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-4">
            Start Governing {industry}{' '}
            <span className="text-white">
              Compliance Today
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
            Every obligation in one register, each with a named owner and the
            evidence attached as the work is done.
          </p>
        </motion.div>

        {/* Plans — name, price and tier order come from the pricing source
            of truth so this grid cannot drift from /pricing. The audience
            sizing line is used instead of the audience line because the
            latter is written for NDIS and healthcare buyers, and this
            component renders on every vertical. */}
        <div className="grid gap-5 max-w-5xl mx-auto mb-12 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLIC_PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 text-left transition-all ${
                tier.featured
                  ? 'border-cyan-500/30 bg-cyan-500/[0.06] shadow-lg'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {tier.featured && tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    <Zap className="h-3 w-3" /> {tier.badge}
                  </span>
                </div>
              )}
              <div className="text-sm font-semibold text-white mb-1">
                {nameFor(tier)}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-white">
                  {priceLabelFor(tier)}
                </span>
                <span className="text-sm text-slate-500">
                  {tier.priceSubtext}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {tier.audienceSize}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-6"
        >
          <Link
            href={compliancePlanHref(`industry_${industry}`)}
            className="group inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-8 py-4 text-sm font-semibold shadow-lg transition-all hover:opacity-90"
          >
            {PUBLIC_CTA_LABELS.compliancePlan}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={salesHref(`industry_${industry}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            {PUBLIC_CTA_LABELS.talkToSales}
          </Link>
        </motion.div>

        <p className="text-xs text-slate-600">
          AU-hosted by default · Assessment-led onboarding · Your data never leaves Australia
        </p>
      </div>
    </section>
  );
}
