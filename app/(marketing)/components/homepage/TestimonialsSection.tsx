'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Star, Quote } from 'lucide-react';
import Link from 'next/link';

const TESTIMONIALS = [
  {
    quote:
      'We went from spending two weeks preparing for every NDIS audit to exporting a complete evidence pack in under three hours. The auditor actually complimented our documentation.',
    name: 'Sarah Mitchell',
    role: 'Quality & Compliance Manager',
    company: 'Compass Care Group',
    sector: 'NDIS Provider',
    metric: { value: '87%', label: 'reduction in audit prep time' },
    accentClass: 'border-cyan-500/20',
    bgClass: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    quote:
      'Before FormaOS, control ownership was a spreadsheet that nobody trusted. Now every control has a named owner, a live status, and evidence attached. Our board finally has confidence in our posture.',
    name: 'James Thornton',
    role: 'Head of Risk & Compliance',
    company: 'Meridian Financial Services',
    sector: 'Financial Services',
    metric: { value: '100%', label: 'control ownership assigned' },
    accentClass: 'border-violet-500/20',
    bgClass: 'from-violet-500/10 to-indigo-500/10',
  },
  {
    quote:
      'Managing compliance across 12 aged care sites used to mean 12 different folder structures and no central view. FormaOS gave us one operating model with local accountability at every site.',
    name: 'Dr. Rachel Kwan',
    role: 'Chief Operating Officer',
    company: 'Evergreen Health Group',
    sector: 'Healthcare & Aged Care',
    metric: { value: '12 sites', label: 'unified under one model' },
    accentClass: 'border-emerald-500/20',
    bgClass: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    quote:
      'The incident reporting workflow alone justified the switch. What used to be email chains and lost paperwork is now a structured, timestamped trail that satisfies the Quality & Safeguards Commission every time.',
    name: 'Michael Davies',
    role: 'Operations Director',
    company: 'Aspire Disability Services',
    sector: 'NDIS Provider',
    metric: { value: '< 24hrs', label: 'incident-to-report time' },
    accentClass: 'border-amber-500/20',
    bgClass: 'from-amber-500/10 to-orange-500/10',
  },
] as const;

const CUSTOMER_LOGOS = [
  'Compass Care Group',
  'Meridian Financial',
  'Evergreen Health',
  'Aspire Disability',
  'Pacific Compliance',
  'Atlas Aged Care',
  'Nexus Gov Services',
  'Pinnacle Education',
] as const;

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 max-w-2xl text-center"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Customer Stories
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Trusted by regulated teams across Australia
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Compliance leaders use FormaOS to replace manual evidence collection,
          enforce control ownership, and stay audit-ready year-round.
        </p>
      </motion.div>

      {/* Star rating strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mx-auto mb-14 flex items-center justify-center gap-1.5"
      >
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="h-5 w-5 fill-amber-400 text-amber-400"
          />
        ))}
        <span className="ml-2 text-sm text-slate-400">
          from regulated teams in healthcare, NDIS, finance & government
        </span>
      </motion.div>

      {/* Testimonial cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
        {TESTIMONIALS.map((testimonial, i) => (
          <motion.article
            key={testimonial.name}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.2 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-6 sm:p-8 backdrop-blur-sm ${testimonial.accentClass}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${testimonial.bgClass} opacity-30`}
            />

            {/* Sector badge */}
            <div className="relative mb-5 inline-flex self-start rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {testimonial.sector}
            </div>

            {/* Quote */}
            <div className="relative flex-1">
              <Quote className="mb-3 h-6 w-6 text-white/10" />
              <p className="text-base leading-relaxed text-slate-200">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </div>

            {/* Author + Metric */}
            <div className="relative mt-6 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-5">
              <div>
                <p className="text-sm font-semibold text-white">
                  {testimonial.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {testimonial.role}
                </p>
                <p className="text-xs text-slate-600">
                  {testimonial.company}
                </p>
              </div>

              {/* Outcome metric */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-white">
                  {testimonial.metric.value}
                </p>
                <p className="text-[10px] text-slate-500">
                  {testimonial.metric.label}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Customer logo strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mx-auto mt-16 max-w-4xl"
      >
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Trusted by compliance teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {CUSTOMER_LOGOS.map((logo) => (
            <span
              key={logo}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-400"
            >
              {logo}
            </span>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-10 text-center"
      >
        <Link
          href="/customer-stories"
          className="text-sm font-semibold text-amber-400 underline-offset-4 hover:underline"
        >
          Read all customer stories{' '}
          <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
