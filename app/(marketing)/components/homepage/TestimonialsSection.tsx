'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_50%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 flex items-start gap-5"
      >
        <span className="mt-1.5 h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent" />
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Use case scenarios
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How regulated teams operate with FormaOS
          </h2>
          <p className="mt-4 max-w-xl text-base text-slate-400">
            Anonymized scenarios from regulated organizations. Outcomes reflect
            conditions at the time of deployment. We can walk through full
            deployments during evaluation.
          </p>
        </div>
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
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/20 sm:p-8"
          >
            {/* top accent rail, revealed on hover */}
            <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />

            {/* Header: sector as a real heading, framework as the supporting line */}
            <h3 className="font-display text-xl font-semibold tracking-tight text-white">
              {scenario.sector}
            </h3>
            <p className="mt-1.5 text-sm font-medium text-slate-400">
              {scenario.framework}
            </p>

            {/* Situation — lead paragraph, no label */}
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              {scenario.situation}
            </p>

            {/* Outcomes — the only retained label, as a checklist of wins */}
            <div className="mt-auto border-t border-white/[0.07] pt-5">
              <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                What changed
              </p>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
                {scenario.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                      <Check className="h-2.5 w-2.5 text-slate-200" strokeWidth={2.5} />
                    </span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
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
          className="text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          Read the full scenarios{' '}
          <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
