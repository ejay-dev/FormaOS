'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SectionMedia } from '@/components/marketing/SectionMedia';

const SCENARIOS = [
  {
    sector: 'NDIS Provider',
    framework: 'NDIS Practice Standards (all 8 modules)',
    situation:
      'Reportable incidents tracked in spreadsheets; Commission audits required days of reconstruction across multiple sites.',
    outcomes: [
      'Reportable incident response inside the 24h immediate / 5 business-day detailed timelines',
      'Audit preparation time measured in hours, not weeks',
      'Named control owner at every Practice Standard module',
    ],
    accentClass: 'border-cyan-500/20',
  },
  {
    sector: 'Healthcare Operator',
    framework: 'NSQHS Standards + AHPRA + RACGP',
    situation:
      'Clinical governance controls existed on paper, but proof was inconsistent across sites; practitioner registration tracked manually.',
    outcomes: [
      'AHPRA registration expiry alerts at 90 / 60 / 30 days',
      'Control-to-evidence mapping with NSQHS Standards linkage',
      'Live executive posture view across sites',
    ],
    accentClass: 'border-violet-500/20',
  },
  {
    sector: 'Aged Care Provider',
    framework: 'Aged Care Quality Standards (8 standards)',
    situation:
      'Policy changes were hard to roll out uniformly, periodic reviews slipped without reliable triggers, Standard 8 governance reporting consumed executive time.',
    outcomes: [
      'Policy review cadence enforced with automated task triggers',
      'Evidence renewal and expiry tracking across all facilities',
      'Standard 8 governance reporting compressed from weeks to days',
    ],
    accentClass: 'border-emerald-500/20',
  },
  {
    sector: 'Financial Services',
    framework: 'ISO 27001 + APRA CPS 234 + AML/CTF',
    situation:
      'Third-party risk grew with fintech partnerships, but control ownership and evidence collection remained manual; ASIC breach reporting relied on email threads.',
    outcomes: [
      'APRA CPS 234 control mapping with named owners and evidence trails',
      'ASIC reportable-situation response time inside the statutory window',
      'Board governance packs generated from live data, not reconstructed',
    ],
    accentClass: 'border-amber-500/20',
  },
] as const;

const BUILT_ON_PARTNERS = [
  'Vercel',
  'Supabase',
  'Stripe',
  'Sentry',
  'Resend',
] as const;

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
    >
      <SectionMedia
        src="/marketing-media/enterprise.jpg"
        objectPosition="50% 28%"
        opacity={0.28}
        scrim="center"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-4 max-w-2xl text-center"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Use case scenarios
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How regulated teams operate with FormaOS
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Anonymized scenarios from regulated organizations. Outcomes reflect
          conditions at the time of deployment. We can walk through full
          deployments during evaluation.
        </p>
      </motion.div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
        {SCENARIOS.map((scenario, i) => (
          <motion.article
            key={scenario.sector}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.2 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-6 sm:p-8 ${scenario.accentClass}`}
          >
            <div className="mb-5 inline-flex self-start rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {scenario.sector}
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Framework
            </p>
            <p className="mb-5 text-sm font-medium text-slate-200">
              {scenario.framework}
            </p>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Situation
            </p>
            <p className="mb-5 text-sm leading-relaxed text-slate-300">
              {scenario.situation}
            </p>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              What changed
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              {scenario.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mx-auto mt-16 max-w-4xl"
      >
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Built on
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {BUILT_ON_PARTNERS.map((partner) => (
            <span
              key={partner}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-400"
            >
              {partner}
            </span>
          ))}
        </div>
      </motion.div>

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
          Read the full scenarios{' '}
          <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
