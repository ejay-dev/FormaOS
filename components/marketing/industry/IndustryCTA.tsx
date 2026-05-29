'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import {
  compliancePlanHref,
  salesHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';

export interface IndustryCTAProps {
  industry: string;
  /** Optional urgency callout displayed above pricing */
  urgencyCallout?: string;
}

const plans = [
  {
    name: 'Foundation',
    price: '$297',
    description: 'Solo and micro providers moving compliance off spreadsheets.',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$797',
    description:
      'Most registered NDIS, aged care, and healthcare providers.',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$1,800',
    description: 'Multi-site networks running compliance across many teams.',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description:
      'Networks needing SSO, procurement support, and white-glove rollout.',
    highlighted: false,
  },
];

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
            Join Australian organisations that trust FormaOS to maintain
            continuous compliance.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid gap-5 max-w-5xl mx-auto mb-12 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 text-left transition-all ${
                plan.highlighted
                  ? 'border-cyan-500/30 bg-cyan-500/[0.06] shadow-lg'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}
              <div className="text-sm font-semibold text-white mb-1">
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {plan.description}
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
