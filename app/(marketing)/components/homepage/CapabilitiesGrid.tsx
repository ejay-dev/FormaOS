'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import {
  Workflow,
  Database,
  GitBranch,
  Shield,
  Eye,
  Code2,
  Globe,
  Bot,
} from 'lucide-react';

const capabilities = [
  {
    icon: Workflow,
    title: 'Automation Engine',
    description:
      'Triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation.',
    color: 'from-teal-400 to-emerald-500',
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description:
      'Every upload, review, and approval tracked with full audit trail context and chain of custody.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: GitBranch,
    title: '9 Framework Packs',
    description:
      'SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS Controls, NDIS Practice Standards, and Essential Eight — pre-built.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Shield,
    title: 'Compliance Gates',
    description:
      'Block non-compliant actions before they happen with real-time validation and enforcement.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: Eye,
    title: 'Executive Dashboard',
    description:
      'C-level visibility into compliance posture, framework health, risk trends, and control ownership.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Each entity maintains its own controls and evidence with cross-site rollup reporting for executive governance.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Code2,
    title: 'REST API + Webhooks',
    description:
      'API v1 for compliance data, evidence uploads, and task management. Webhooks for SIEM and tooling integration.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Bot,
    title: 'AI Compliance Assistant',
    description:
      'Context-aware AI that drafts policies, runs gap analysis, and gives actionable steps — powered by your live org data.',
    color: 'from-teal-500 to-cyan-500',
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="mk-section home-section home-section--contrast relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal
          variant="scaleUp"
          range={[0, 0.3]}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Platform Capabilities
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Everything you need.{' '}
            <span className="text-slate-400">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Obligations flow to controls, controls trigger tasks, tasks produce
            evidence. One interconnected system.
          </p>
        </ScrollReveal>

        <SectionChoreography
          pattern="stagger-wave"
          stagger={0.04}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <motion.div
                key={capability.title}
                whileHover={{ y: -4 }}
                className="group relative p-6 rounded-xl bg-gray-950/50 border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-default"
              >
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div
                  className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${capability.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-white group-hover:text-teal-300 transition-colors">
                  {capability.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}
