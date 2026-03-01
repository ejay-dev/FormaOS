'use client';

import { Layers, Building2, Database, UserCheck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const differentiators = [
  {
    icon: Layers,
    title: 'A True Compliance Operating System',
    description: 'FormaOS is infrastructure, not a tool. It orchestrates governance, execution, and evidence across your organization.',
    details: [
      'Unified data model linking frameworks, controls, tasks, and evidence',
      'Workflow engine that automates cross-team compliance handoffs',
      'Real-time dashboards with org-wide compliance posture at a glance',
    ],
  },
  {
    icon: Building2,
    title: 'Built for Regulated Environments',
    description: 'Designed specifically for healthcare, NDIS, finance, education, and government-aligned organizations.',
    details: [
      'Pre-built framework mappings for NDIS, ISO 27001, SOC 2, and more',
      'Multi-entity support for complex organizational structures',
      'Region-aware controls that adapt to local regulatory requirements',
    ],
  },
  {
    icon: Database,
    title: 'Evidence by Design',
    description: 'Every action produces verifiable, structured evidence automatically.',
    details: [
      'Automatic evidence capture from task completions and approvals',
      'Tamper-evident audit logs with cryptographic integrity checks',
      'Evidence linked directly to the control it satisfies — no manual mapping',
    ],
  },
  {
    icon: UserCheck,
    title: 'Accountability at Scale',
    description: 'Every control has a defined owner, status, and outcome. Accountability is structural — not cultural.',
    details: [
      'Control ownership assigned by name, role, and team',
      'Automated escalation when controls drift or tasks overdue',
      'Accountability trails for every governance decision',
    ],
  },
  {
    icon: Shield,
    title: 'Audit Defense, Not Audit Prep',
    description: 'You are always audit-ready because your compliance runs continuously — evidence is never reconstructed.',
    details: [
      'Evidence generated automatically at point of execution',
      'Framework-mapped audit packets exportable in minutes',
      'Multi-year compliance history preserved with chain of custody',
    ],
  },
] as const;

export function WhatMakesDifferent() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              What Makes FormaOS Different
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white">
              Not just another{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                compliance tool
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              FormaOS is infrastructure. It orchestrates governance, execution, and evidence across your organization — not just records.
            </p>
          </div>
        </ScrollReveal>

        <SectionChoreography pattern="stagger-wave" stagger={0.06} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-teal-400/20 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden group ${
                  index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/0 group-hover:via-teal-400/20 to-transparent transition-all duration-500" />

                {/* Icon */}
                <div className="inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-3 mb-4">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>

                <h3 className="text-base font-semibold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Detail bullets — always visible */}
                <ul className="space-y-2">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/50" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}
