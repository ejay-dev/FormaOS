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
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description:
      'Every upload, review, and approval tracked with full audit trail context and chain of custody.',
  },
  {
    icon: GitBranch,
    title: '9 Framework Packs',
    description:
      'SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS Controls, NDIS Practice Standards, and Essential Eight, pre-built.',
  },
  {
    icon: Shield,
    title: 'Compliance Gates',
    description:
      'Block non-compliant actions before they happen with real-time validation and enforcement.',
  },
  {
    icon: Eye,
    title: 'Executive Dashboard',
    description:
      'C-level visibility into compliance posture, framework health, risk trends, and control ownership.',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Each entity maintains its own controls and evidence with cross-site rollup reporting for executive governance.',
  },
  {
    icon: Code2,
    title: 'REST API + Webhooks',
    description:
      'API v1 for compliance data, evidence uploads, and task management. Webhooks for SIEM and tooling integration.',
  },
  {
    icon: Bot,
    title: 'AI Compliance Assistant',
    description:
      'Context-aware AI that drafts policies, runs gap analysis, and gives actionable steps, powered by your live org data.',
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="mk-section home-section home-section--contrast relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.3]}
          className="mb-12 flex items-start gap-5 lg:mb-14"
        >
          <span className="mt-1.5 h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent" />
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Platform capabilities
            </p>
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Everything you need.{' '}
              <span className="text-slate-400">Nothing you don&apos;t.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              Obligations flow to controls, controls trigger tasks, tasks produce
              evidence. One interconnected system.
            </p>
          </div>
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
                className="group relative p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-colors duration-300 cursor-default"
              >
                <div className="inline-flex p-2.5 rounded-lg border border-white/10 bg-white/[0.05] mb-4">
                  <Icon className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-white">
                  {capability.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
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
