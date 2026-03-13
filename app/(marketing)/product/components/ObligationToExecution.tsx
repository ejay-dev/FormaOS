'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const FLOW = [
  {
    input: 'Obligations',
    output: 'Structured controls',
    description: 'Regulatory requirements and internal policies become a live data model — framework-mapped, assigned, versioned.',
  },
  {
    input: 'Controls',
    output: 'Owned tasks',
    description: 'Controls don\'t sit in a spreadsheet. They route to named owners with deadlines, escalation rules, and execution logs.',
  },
  {
    input: 'Tasks',
    output: 'Live evidence',
    description: 'Every task completion produces timestamped, actor-attributed evidence — structured, not free-form files.',
  },
  {
    input: 'Evidence',
    output: 'Defensible audit trail',
    description: 'Evidence is linked to controls, frameworks, and approvers. An auditor can trace any decision back to its source.',
  },
] as const;

export function ObligationToExecution() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">

        {/* Left-aligned heading */}
        <ScrollReveal variant="fadeUp">
          <div className="mb-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-5">
              The operating model
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl">
              You don&apos;t just record compliance.
              <br />
              <span className="text-teal-400">You run it.</span>
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-slate-400">
              Most platforms stop at documentation. FormaOS operationalizes
              compliance — obligations become enforced controls, controls become
              owned tasks, tasks become evidence.
            </p>
          </div>
        </ScrollReveal>

        {/* Flow — 4-step progression */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04]">
          {FLOW.map((item, i) => (
            <ScrollReveal key={item.input} variant="fadeUp">
              <div className="bg-[#030712] px-6 py-7 h-full flex flex-col">
                {/* Step number */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500/50 mb-4">
                  Step {String(i + 1).padStart(2, '0')}
                </p>

                {/* Transformation */}
                <div className="mb-4">
                  <p className="text-xs text-slate-600 mb-1">{item.input}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[10px] text-slate-700">→</span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    {item.output}
                  </p>
                </div>

                <p className="text-xs leading-[1.65] text-slate-500 flex-1">
                  {item.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom statement */}
        <ScrollReveal variant="fadeUp">
          <div className="mt-8 grid sm:grid-cols-3 gap-2">
            {[
              'Every action is tracked and attributed',
              'Every control has a named owner',
              'Every outcome is provable',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-slate-900/30 px-4 py-3"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500/50" />
                <p className="text-xs text-slate-400">{item}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
