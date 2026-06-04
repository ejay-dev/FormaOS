'use client';

import {
  FileText,
  Shield,
  CheckSquare,
  Lock,
  BarChart3,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

// One connected lifecycle, rendered once. Each requirement travels the
// same path: a framework obligation becomes an owned control, an owned
// task, sealed evidence, and finally an exportable audit trail. Lifts the
// homepage engine hand (icon nodes + travelling pulse) but resolves to a
// concrete audit-trail artifact rather than a posture scorecard.
const lifecycle = [
  { n: '01', label: 'Obligation', icon: FileText, detail: 'Framework requirement mapped' },
  { n: '02', label: 'Control', icon: Shield, detail: 'Ownership and cadence set' },
  { n: '03', label: 'Task', icon: CheckSquare, detail: 'Routed to the owner' },
  { n: '04', label: 'Evidence', icon: Lock, detail: 'Artifacts linked and sealed' },
  { n: '05', label: 'Audit', icon: BarChart3, detail: 'Exportable trail' },
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

        {/* One connected lifecycle → exportable audit trail */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.4]}>
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-10">
            {/* Pipeline */}
            <div className="relative">
              {/* Connecting rail + travelling pulse (desktop) */}
              <div className="pointer-events-none absolute left-[10%] right-[10%] top-7 hidden h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 md:block" />
              <span className="engine-pulse pointer-events-none absolute top-7 hidden h-[3px] w-20 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[1px] md:block" />

              <ol className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
                {lifecycle.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.n}
                      className="group relative flex flex-col items-center text-center"
                    >
                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-[#0a0f1d] text-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/30 group-hover:text-white">
                        <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 bg-[#0a0f1d] px-1 font-mono text-[10px] font-semibold text-slate-400">
                          {step.n}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">
                        {step.label}
                      </p>
                      <p className="mt-1 max-w-[150px] text-xs leading-relaxed text-slate-500">
                        {step.detail}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Output: the audit trail it produces */}
            <div className="mt-10 border-t border-white/[0.07] pt-8">
              <div className="flex flex-wrap items-center gap-4">
                <ArrowRight
                  className="hidden h-5 w-5 text-slate-600 sm:block"
                  aria-hidden="true"
                />
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.03]">
                  <FileCheck className="h-6 w-6 text-slate-200" strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    What you can hand an auditor
                  </p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    A complete trail: every step timestamped, owner-attributed,
                    and evidence-linked.
                  </p>
                </div>
                <span className="ml-auto rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Illustrative
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Truths — plain text, no chips */}
        <ScrollReveal
          variant="fadeUp"
          range={[0.1, 0.45]}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-400"
        >
          {TRUTHS.map((t, i) => (
            <span key={t} className="flex items-center gap-3">
              {i > 0 && (
                <span className="text-slate-700" aria-hidden="true">
                  ·
                </span>
              )}
              {t}
            </span>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
