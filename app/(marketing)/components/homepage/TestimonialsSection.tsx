'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Check,
  Landmark,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const SCENARIOS = [
  {
    sector: 'NDIS Provider',
    icon: Accessibility,
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
    icon: Stethoscope,
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
    icon: Users,
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
    icon: Landmark,
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

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [active, setActive] = useState(0);
  const scenario = SCENARIOS[active];

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
        className="mx-auto mb-4 flex w-full max-w-6xl items-start gap-5"
      >
        <span className="mt-1.5 h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent" />
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How regulated teams operate with FormaOS
          </h2>
          <p className="mt-4 max-w-xl text-base text-zinc-400">
            Anonymised scenarios from regulated organisations. Outcomes reflect
            conditions at the time of deployment. We can walk through full
            deployments during evaluation.
          </p>
        </div>
      </motion.div>

      {/* Interactive explorer: pick a sector on the left, read one scenario on
          the right. Replaces the four full-text cards so only a quarter of the
          copy is on screen at once. */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-8"
      >
        {/* Sector selector */}
        <div
          role="tablist"
          aria-label="Use case sectors"
          className="flex flex-col gap-2.5 lg:col-span-5"
        >
          {SCENARIOS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === active;
            return (
              <button
                key={s.sector}
                type="button"
                role="tab"
                id={`scenario-tab-${i}`}
                aria-selected={isActive}
                aria-controls="scenario-panel"
                onClick={() => setActive(i)}
                className={`group relative flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors duration-200 ${
                  isActive
                    ? 'border-white/20 bg-white/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-9 w-0.5 -translate-y-1/2 rounded-full bg-white/70" />
                )}
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isActive
                      ? 'border-white/15 bg-white/[0.06] text-white'
                      : 'border-white/10 bg-white/[0.02] text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[15px] font-semibold ${
                      isActive ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {s.sector}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-400">
                    {s.framework}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected scenario detail */}
        <div className="lg:col-span-7">
          <div
            key={active}
            role="tabpanel"
            id="scenario-panel"
            aria-labelledby={`scenario-tab-${active}`}
            className="flex h-full animate-[fadeIn_0.3s_ease] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 sm:p-9"
          >
            <div className="flex flex-wrap gap-1.5">
              {scenario.framework.split(' + ').map((fw) => (
                <span
                  key={fw}
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400"
                >
                  {fw}
                </span>
              ))}
            </div>

            <div className="mt-7">
              <p className="mb-2.5 text-sm font-medium text-zinc-300">
                The challenge
              </p>
              <p className="text-lg leading-relaxed text-zinc-200">
                {scenario.situation}
              </p>
            </div>

            <div className="mt-auto border-t border-white/[0.07] pt-7">
              <p className="mb-3.5 text-sm font-medium text-zinc-300">
                What changed
              </p>
              <ul className="space-y-3 text-sm leading-relaxed text-zinc-200">
                {scenario.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                      <Check
                        className="h-2.5 w-2.5 text-zinc-200"
                        strokeWidth={2.5}
                      />
                    </span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-16 text-center"
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
