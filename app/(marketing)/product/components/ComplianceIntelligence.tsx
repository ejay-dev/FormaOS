'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const INTELLIGENCE_AREAS = [
  {
    title: 'Real-Time Posture Scoring',
    description:
      'Continuous compliance score across all active frameworks — not a snapshot, a live indicator that updates as controls pass or drift.',
    detail: 'Trend history, regression alerts, per-framework breakdown',
  },
  {
    title: 'Gap Detection',
    description:
      'Automated gap analysis surfaces missing evidence, overdue controls, and coverage weaknesses before your auditors do.',
    detail: 'Root-cause attribution, control dependency mapping',
  },
  {
    title: 'Executive Dashboard',
    description:
      'Board-ready posture reports, C-level compliance narrative, and risk trend visibility — without manual report assembly.',
    detail: 'Multi-entity rollup, exportable board packets',
  },
  {
    title: 'Automation Analytics',
    description:
      'Task velocity, completion rates, escalation history, and trigger performance — so you can tune your compliance operations.',
    detail: 'Workflow metrics, control health over time',
  },
] as const;

const METRICS = [
  { value: 'Real-time', label: 'Compliance posture updates' },
  { value: 'Continuous', label: 'Gap detection cadence' },
  { value: '< 2 min', label: 'Board report assembly' },
  { value: 'Multi-entity', label: 'Org-wide rollup view' },
] as const;

export function ComplianceIntelligence() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">

        {/* Left-aligned heading */}
        <ScrollReveal variant="fadeUp">
          <div className="mb-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-5">
              Intelligence layer
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl">
              Live visibility into your
              <br />
              <span className="text-teal-400">compliance posture.</span>
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-slate-400">
              Built-in analytics so teams stop building manual reports and start
              maintaining continuous, defensible compliance posture.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 intelligence areas */}
        <div className="grid sm:grid-cols-2 gap-2 mb-8">
          {INTELLIGENCE_AREAS.map((area) => (
            <ScrollReveal key={area.title} variant="fadeUp">
              <div className="rounded-2xl border border-white/[0.07] bg-slate-900/40 px-6 py-6 hover:border-white/[0.1] transition-colors duration-200">
                <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">
                  {area.title}
                </h3>
                <p className="text-sm leading-[1.7] text-slate-400 mb-3">
                  {area.description}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {area.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Metrics strip */}
        <ScrollReveal variant="fadeUp">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-[#030712] px-5 py-5 text-center">
                <p className="text-lg font-semibold text-white">{m.value}</p>
                <p className="text-[11px] text-slate-600 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
