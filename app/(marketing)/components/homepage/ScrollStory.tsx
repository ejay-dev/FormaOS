'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Box, Zap, ShieldCheck, FileCheck } from 'lucide-react';

const steps = [
  {
    id: 'model',
    step: '01',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements.',
    icon: Box,
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    step: '02',
    title: 'Operationalize',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic.',
    icon: Zap,
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    step: '03',
    title: 'Validate',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current.',
    icon: ShieldCheck,
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    step: '04',
    title: 'Defend',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations - all exportable.',
    icon: FileCheck,
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

export function ScrollStory() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp" className="text-center mb-16">
          <span className="mk-badge mk-badge--section mb-6">How It Works</span>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            The Compliance <span className="text-teal-400">Lifecycle</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From framework mapping to audit defense — a complete workflow that
            transforms obligations into enforceable controls with clear
            ownership.
          </p>
        </ScrollReveal>

        <div className="max-w-3xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            return (
              <ScrollReveal key={step.id} variant="fadeUp">
                <div className="relative flex gap-6">
                  {/* Step indicator + connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20">
                      <span className="text-sm font-semibold text-teal-400 tabular-nums">
                        {step.step}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-white/[0.06] my-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={isLast ? 'pb-0' : 'pb-10'}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <h3 className="text-lg font-semibold text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      {step.description}
                    </p>

                    <ul className="space-y-1.5">
                      {step.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-slate-500"
                        >
                          <span className="w-1 h-1 rounded-full bg-teal-400/60 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
