'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  Box,
  Zap,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

const steps = [
  {
    id: 'model',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
    color: 'from-teal-400 to-emerald-500',
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    title: 'Operationalize',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic. The OS ensures execution, not just intention.',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    title: 'Validate',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current, never a point-in-time snapshot.',
    icon: ShieldCheck,
    color: 'from-teal-600 to-emerald-600',
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    title: 'Defend',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations. All exportable, all defensible, all undeniable.',
    icon: FileCheck,
    color: 'from-amber-500 to-teal-500',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

/* ── Lifecycle step card ── */
function LifecycleCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <ScrollReveal variant="fadeUp" range={[index * 0.04, 0.3 + index * 0.04]}>
      <div className="group relative">
        {/* Timeline connector (visible between cards) */}
        {index < steps.length - 1 && (
          <div className="absolute left-1/2 -translate-x-px top-full h-12 lg:h-16 w-px bg-gradient-to-b from-white/10 to-transparent z-0" />
        )}

        <div className={`relative grid lg:grid-cols-2 gap-6 lg:gap-10 items-center ${!isEven ? 'lg:direction-rtl' : ''}`}>
          {/* Step number + connector node */}
          <div className={`absolute left-1/2 -translate-x-1/2 top-0 z-20 hidden lg:flex flex-col items-center`}>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-black/20 ring-4 ring-[#0a0f1c]`}>
              <span className="text-sm font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Content side */}
          <div className={`${!isEven ? 'lg:col-start-2 lg:text-left' : ''}`}>
            <motion.div
              whileHover={{ y: -4 }}
              className="home-panel home-panel--interactive relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shadow-xl shadow-black/20"
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500`} />
              {/* Top glow line */}
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${step.color.replace('from-', 'via-').split(' ')[0]}/30 to-transparent rounded-t-2xl`} />

              <div className="relative">
                {/* Mobile step number */}
                <div className="lg:hidden flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Step {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-teal-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm lg:text-base text-gray-400 leading-relaxed mb-5">
                  {step.description}
                </p>

                <div className="space-y-2.5">
                  {step.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color} mt-2 flex-shrink-0`} />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual side — flow indicator */}
          <div className={`hidden lg:flex items-center ${isEven ? 'justify-end' : 'justify-start lg:col-start-1 lg:row-start-1'}`}>
            <div className="relative">
              {/* Arrow connecting to next step */}
              <div className={`flex items-center gap-3 ${!isEven ? 'flex-row-reverse' : ''}`}>
                <div className={`h-px w-16 bg-gradient-to-r ${isEven ? step.color : `${step.color.split(' ')[1]} ${step.color.split(' ')[0]}`}`} />
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
                  Step {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── Main export ── */
export function ScrollStory() {
  return (
    <section className="mk-section home-section home-section--process relative overflow-hidden">
      {/* Subtle accent borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            How It Works
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            The Compliance
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {' '}Lifecycle
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From framework mapping to audit defense — a complete workflow that
            transforms obligations into enforceable controls with clear ownership.
          </p>
        </ScrollReveal>

        {/* Lifecycle steps — vertical flow */}
        <div className="relative">
          {/* Central timeline line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/20 via-emerald-500/15 to-teal-600/20" />

          <div className="space-y-8 lg:space-y-12">
            {steps.map((step, i) => (
              <LifecycleCard key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
