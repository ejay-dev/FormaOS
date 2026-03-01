'use client';

import { useState } from 'react';
import { Layers, Building2, Database, UserCheck, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const differentiators = [
  {
    icon: Layers,
    title: 'A True Compliance Operating System',
    description: 'FormaOS is infrastructure, not a tool. It orchestrates governance, execution, and evidence across your organization.',
    color: 'from-teal-400 to-emerald-500',
    backDetails: [
      'Unified data model linking frameworks, controls, tasks, and evidence',
      'Workflow engine that automates cross-team compliance handoffs',
      'Real-time dashboards with org-wide compliance posture at a glance',
    ],
  },
  {
    icon: Building2,
    title: 'Built for Regulated Environments',
    description: 'Designed specifically for healthcare, NDIS, finance, education, and government-aligned organizations.',
    color: 'from-emerald-500 to-teal-600',
    backDetails: [
      'Pre-built framework mappings for NDIS, ISO 27001, SOC 2, and more',
      'Multi-entity support for complex organizational structures',
      'Region-aware controls that adapt to local regulatory requirements',
    ],
  },
  {
    icon: Database,
    title: 'Evidence by Design',
    description: 'Every action produces verifiable, structured evidence automatically.',
    color: 'from-teal-600 to-emerald-600',
    backDetails: [
      'Automatic evidence capture from task completions and approvals',
      'Tamper-evident audit logs with cryptographic integrity checks',
      'Evidence linked directly to the control it satisfies -- no manual mapping',
    ],
  },
  {
    icon: UserCheck,
    title: 'Accountability at Scale',
    description: 'Every control has a defined owner, status, and outcome. Accountability is structural — not cultural.',
    color: 'from-amber-500 to-teal-500',
    backDetails: [
      'Control ownership assigned by name, role, and team',
      'Automated escalation when controls drift or tasks overdue',
      'Accountability trails for every governance decision',
    ],
  },
  {
    icon: Shield,
    title: 'Audit Defense, Not Audit Prep',
    description: 'You are always audit-ready because your compliance runs continuously — evidence is never reconstructed.',
    color: 'from-rose-500 to-amber-500',
    backDetails: [
      'Evidence generated automatically at point of execution',
      'Framework-mapped audit packets exportable in minutes',
      'Multi-year compliance history preserved with chain of custody',
    ],
  },
];

/** Flip card wrapper -- shows back face with detail bullets on hover (first 3 cards only) */
function FlipCard({ item, index }: { item: typeof differentiators[number]; index: number }) {
  const Icon = item.icon;
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const hasBack = 'backDetails' in item && Array.isArray((item as any).backDetails);

  // For cards without a back face or when reduced motion is preferred, render the original card
  if (!hasBack || prefersReducedMotion) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`product-panel product-panel--interactive group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer backdrop-blur-sm ${index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
      >
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-5 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-400 leading-relaxed">{item.description}</p>
      </motion.div>
    );
  }

  const backDetails = (item as any).backDetails as string[];

  return (
    <motion.div
      style={{ perspective: 1000 }}
      className={`relative cursor-pointer ${index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
      onHoverStart={() => setIsFlipped(true)}
      onHoverEnd={() => setIsFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full"
      >
        {/* Front face */}
        <div
          className="product-panel group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-orange-500/30 transition-all backdrop-blur-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-5 group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-400 transition-colors">
            {item.title}
          </h3>
          <p className="text-gray-400 leading-relaxed">{item.description}</p>
          {/* Flip hint */}
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Hover to learn more
          </div>
        </div>

        {/* Back face */}
        <div
          className="product-panel absolute inset-0 p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-orange-500/20 backdrop-blur-sm flex flex-col justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${item.color} mb-4 w-fit`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-4 text-orange-400">
            {item.title}
          </h3>
          <ul className="space-y-3">
            {backDetails.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function WhatMakesDifferent() {
  return (
    <section className="product-section product-section--core relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                What Makes FormaOS Different
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Not Just Another
              <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                {' '}Compliance Tool
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <SectionChoreography pattern="alternating" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.map((item, index) => (
            <FlipCard key={item.title} item={item} index={index} />
          ))}
        </SectionChoreography>
      </div>
    </section>
  );
}
