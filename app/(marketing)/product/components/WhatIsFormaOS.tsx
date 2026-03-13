'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const UNIFIES = [
  { label: 'Governance structure and framework alignment' },
  { label: 'Policy, control, and obligation execution' },
  { label: 'Automated evidence generation and chain-of-custody' },
  { label: 'Real-time risk scoring and drift detection' },
  { label: 'Audit defense with exportable evidence packages' },
  { label: 'Control ownership across teams and entities' },
  { label: 'Role-based accountability and access governance' },
] as const;

const WHAT_IT_IS_NOT = [
  'A document repository',
  'A GRC checklist tool',
  'A point-in-time assessment platform',
  'Another spreadsheet replacement',
] as const;

export function WhatIsFormaOS() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — what it is */}
          <ScrollReveal variant="fadeUp">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-5">
              What is FormaOS?
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white mb-5 sm:text-4xl">
              An end-to-end compliance
              <br />
              <span className="text-teal-400">operating system.</span>
            </h2>
            <p className="text-base leading-[1.75] text-slate-400 mb-8">
              FormaOS is an operational layer that enforces compliance as your
              organization works — continuously, with evidence generated
              automatically and accountability built into the system.
            </p>

            {/* What it&rsquo;s not */}
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                Not a:
              </p>
              <div className="flex flex-wrap gap-2">
                {WHAT_IT_IS_NOT.map((item) => (
                  <span
                    key={item}
                    className="text-xs text-slate-600 border border-white/[0.05] bg-slate-900/30 rounded-full px-3 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right — what it unifies */}
          <ScrollReveal variant="fadeUp">
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 px-7 py-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-5">
                FormaOS unifies:
              </p>
              <ul className="space-y-3">
                {UNIFIES.map((item, i) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-[6px] text-[10px] font-semibold tabular-nums text-teal-500/50 w-4 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-[1.6] text-slate-300">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-5 border-t border-white/[0.06] text-xs text-slate-600 leading-relaxed">
                Unified in a single, continuously operating compliance layer.
                No silos. No manual reconciliation. No last-minute
                reconstruction.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
