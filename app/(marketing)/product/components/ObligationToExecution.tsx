'use client';

import { Fragment } from 'react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

// One connected lifecycle, rendered once. Each requirement travels the
// same path: a framework obligation becomes an owned control, an owned
// task, sealed evidence, and finally an exportable audit trail. Replaces
// the old duplicated flow-cards + lifecycle-strip + proof-chips stack.
const lifecycle = [
  { label: 'Obligation', detail: 'Framework requirement mapped' },
  { label: 'Control', detail: 'Ownership and cadence assigned' },
  { label: 'Task', detail: 'Routed to the accountable owner' },
  { label: 'Evidence', detail: 'Artifacts linked and sealed' },
  { label: 'Audit', detail: 'Exportable compliance trail' },
] as const;

const TRUTHS = [
  'Every action is tracked',
  'Every control has an owner',
  'Every outcome is provable',
] as const;

export function ObligationToExecution() {
  return (
    <section className="product-section product-section--process relative overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
        {/* Header — left labelled rule + paired descriptor */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mb-14 grid gap-x-12 gap-y-5 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-end"
        >
          <div>
            <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span className="h-px w-8 bg-white/25" />
              <span>From obligation to execution</span>
            </div>
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
              You don&rsquo;t just record compliance. You run it.
            </h2>
          </div>
          <p className="text-sm leading-7 text-slate-400 lg:pb-1">
            Most platforms stop at documentation. FormaOS operationalises every
            requirement, so the same path runs end to end across your
            organisation.
          </p>
        </ScrollReveal>

        {/* One connected lifecycle */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.4]}>
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 sm:px-10">
            {/* Connector rail (desktop) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-16 top-[4.75rem] hidden h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 lg:block"
            />
            <SectionChoreography
              pattern="cascade"
              stagger={0.06}
              className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-0"
            >
              {lifecycle.map((stage, index) => (
                <Fragment key={stage.label}>
                  <div className="relative flex flex-1 flex-col items-center text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0a0f1c] text-[13px] font-semibold tabular-nums text-slate-300">
                      {index + 1}
                    </span>
                    <p className="mt-4 text-base font-semibold text-white">
                      {stage.label}
                    </p>
                    <p className="mt-1.5 max-w-[12rem] text-[13px] leading-snug text-slate-400">
                      {stage.detail}
                    </p>
                  </div>
                  {index < lifecycle.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-center text-slate-600 lg:pt-4"
                    >
                      <span className="lg:hidden">↓</span>
                    </div>
                  )}
                </Fragment>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>

        {/* Truths — plain text, no chips */}
        <ScrollReveal
          variant="fadeUp"
          range={[0.1, 0.45]}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-400"
        >
          {TRUTHS.map((t, i) => (
            <Fragment key={t}>
              {i > 0 && (
                <span className="text-slate-700" aria-hidden="true">
                  ·
                </span>
              )}
              <span>{t}</span>
            </Fragment>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
