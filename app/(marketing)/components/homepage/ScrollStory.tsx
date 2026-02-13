'use client';

import { motion, useScroll } from 'framer-motion';
import { duration } from '@/config/motion';
import { useRef } from 'react';
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
    variant: 'default' as const,
    color: 'from-cyan-400 to-blue-500',
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
    variant: 'connecting' as const,
    color: 'from-blue-500 to-purple-500',
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
    variant: 'verified' as const,
    color: 'from-purple-500 to-pink-500',
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
    variant: 'complete' as const,
    color: 'from-pink-500 to-cyan-500',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

function CompactStoryStep({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -8 }}
      className="group relative pt-4 mt-4 p-8 rounded-3xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-xl shadow-black/20"
    >
      <motion.div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors duration-300">
          {step.title}
        </h3>
      </div>

      <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

      <div className="space-y-3">
        {step.features.map((feature, featureIdx) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + featureIdx * 0.08 }}
            className="flex items-center gap-3 group/feature"
          >
            <motion.div
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
              whileHover={{ scale: 1.5 }}
            />
            <span className="text-sm text-gray-500 group-hover/feature:text-gray-300 transition-colors">
              {feature}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={containerRef}
      className="mk-section relative overflow-hidden"
      style={{ position: 'relative' }}
    >
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            The Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {' '}
              Lifecycle
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From framework mapping to audit defense - a complete workflow that
            transforms obligations into enforceable controls with clear
            ownership.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <CompactStoryStep
              key={step.id}
              step={step}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
