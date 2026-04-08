'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

export interface IndustryCTAProps {
  industry: string;
}

const plans = [
  {
    name: 'Starter',
    price: '$159',
    description: 'For small teams getting started with compliance.',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$239',
    description: 'For growing organisations with active compliance obligations.',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$399',
    description: 'For regulated enterprises with complex multi-framework needs.',
    highlighted: false,
  },
];

export function IndustryCTA({ industry }: IndustryCTAProps) {
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-4">
            Start Governing {industry}{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Compliance Today
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
            Join Australian organisations that trust FormaOS to maintain continuous compliance.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 text-left transition-all ${
                plan.highlighted
                  ? 'border-cyan-500/30 bg-cyan-500/[0.06] shadow-lg shadow-cyan-500/10'
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
              <div className="text-sm font-semibold text-white mb-1">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{plan.description}</p>
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
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:brightness-110"
          >
            Start 14-Day Free Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Talk to a compliance specialist
          </Link>
        </motion.div>

        <p className="text-xs text-slate-600">
          AU-hosted · No credit card required · Cancel anytime · Your data never leaves Australia
        </p>
      </div>
    </section>
  );
}
