'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const steps = [
  {
    step: '01',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, assign named owners, set evidence requirements.',
    details: [
      'Framework-to-control mapping',
      'Ownership and accountability chains',
      'Governance hierarchy as a live data model',
    ],
  },
  {
    step: '02',
    title: 'Operationalize',
    description:
      'Controls become enforced workflows. Tasks route to named owners, deadlines are tracked, escalations fire automatically.',
    details: [
      'Automated task generation from control state',
      'Deadline tracking with escalation rules',
      'Immutable execution logs on every action',
    ],
  },
  {
    step: '03',
    title: 'Validate',
    description:
      'The OS continuously verifies control status. Gaps surface instantly. Your compliance posture is always current — not estimated.',
    details: [
      'Real-time control verification',
      'Continuous posture scoring',
      'Instant gap detection with root cause',
    ],
  },
  {
    step: '04',
    title: 'Defend',
    description:
      'When auditors arrive, the evidence is already assembled — timestamped, chain-of-custody tracked, and exportable by framework.',
    details: [
      'Pre-assembled, framework-mapped evidence packages',
      'Immutable audit trail with actor attribution',
      'One-click regulatory export in minutes',
    ],
  },
];

export function ScrollStory() {
  return (
    <section className="mk-section home-section relative">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        {/* Section label — minimal, no pill badge */}
        <ScrollReveal variant="fadeUp">
          <p className="mb-14 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
            How it works
          </p>
        </ScrollReveal>

        {/* Steps — 2-column grid, alternating */}
        <div className="grid sm:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
          {steps.map((step) => (
            <ScrollReveal key={step.step} variant="fadeUp">
              <div className="flex gap-5 p-7 sm:p-8">
                {/* Step number */}
                <div className="shrink-0 pt-0.5">
                  <span className="text-[11px] font-semibold tabular-nums text-teal-500/70 tracking-wide">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-[1.7] text-slate-400 mb-4">
                    {step.description}
                  </p>
                  <ul className="space-y-1.5">
                    {step.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-xs text-slate-600 leading-[1.5]"
                      >
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-teal-500/40" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
