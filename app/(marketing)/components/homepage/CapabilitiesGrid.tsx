'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import {
  Workflow,
  Database,
  Lock,
  GitBranch,
  Layers,
  Terminal,
  Eye,
  Clock,
  Globe,
  Shield,
  ScanSearch,
  FileStack,
  Activity,
  ShieldAlert,
  Building,
  ClipboardList,
  HeartPulse,
} from 'lucide-react';

const capabilities = [
  {
    icon: Workflow,
    title: 'Automation Engine',
    description:
      'Automation triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation notifications.',
    color: 'from-teal-400 to-emerald-500',
  },
  {
    icon: Database,
    title: 'Evidence Versioning',
    description:
      'Evidence activity is logged with full audit trail context. Every upload, review, and approval is tracked for compliance readiness.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Lock,
    title: 'Compliance Score Engine',
    description:
      'Continuous compliance scoring with trend insights and snapshot history when enabled.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: GitBranch,
    title: 'Framework Packs',
    description:
      '7 pre-built frameworks (ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS).',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Layers,
    title: 'Cross-Framework Mapping',
    description:
      'Control mappings across SOC 2, NIST CSF, and CIS Controls with coverage visibility.',
    color: 'from-rose-500 to-orange-500',
  },
  {
    icon: Terminal,
    title: 'Compliance Intelligence',
    description:
      'Real-time compliance scoring with trend analysis and risk insights across all frameworks.',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    icon: Eye,
    title: 'Executive Dashboard',
    description:
      'C-level visibility into compliance posture, framework health, and risk trends.',
    color: 'from-yellow-500 to-lime-500',
  },
  {
    icon: Clock,
    title: 'REST API v1',
    description:
      'REST API v1 for compliance data, evidence uploads, and tasks. Webhook endpoints included for real-time event notifications.',
    color: 'from-yellow-500 to-green-500',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Planned enterprise roadmap: multi-site hierarchies, business units, and cross-site rollups.',
    color: 'from-green-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Block non-compliant actions before they happen. Real-time validation ensures controls are satisfied before proceeding.',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    icon: ScanSearch,
    title: 'Automated Compliance Gap Analysis',
    description:
      'Run gap analysis per framework to identify compliance gaps, missing evidence, and control weaknesses before auditors do.',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    icon: FileStack,
    title: 'Document Audit Trail',
    description:
      'Every document change is tracked with a complete audit log. Maintain audit-ready records with full visibility into who changed what and when.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Activity,
    title: 'Compliance Activity Logging',
    description:
      'Comprehensive logging of compliance events across your organization. Track evidence uploads, task completions, and control changes in your audit log.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: ShieldAlert,
    title: 'Security Event Tracking',
    description:
      'Track and correlate security events across your compliance infrastructure with request-level correlation IDs, structured logging, and audit trail linkage.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Building,
    title: 'Multi-Entity Compliance',
    description:
      'Manage compliance across multiple entities with centralized oversight and organization-scoped controls and evidence.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: ClipboardList,
    title: 'Operational Registers',
    description:
      'Built-in training registers and asset registers to track staff certifications, equipment, and operational readiness in one place.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: HeartPulse,
    title: 'Healthcare & Patient Management',
    description:
      'Purpose-built modules for progress notes, patient management, and clinical workflows designed for healthcare and allied health providers.',
    color: 'from-pink-500 to-rose-500',
  },
];

// Group capabilities into categories for visual differentiation
const capabilityCategories = [
  { label: 'Core Engine', range: [0, 4] as const },
  { label: 'Framework Intelligence', range: [4, 8] as const },
  { label: 'Operational Infrastructure', range: [8, 12] as const },
  { label: 'Domain Modules', range: [12, 16] as const },
];

export function CapabilitiesGrid() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="scaleUp" range={[0, 0.3]} className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Platform Capabilities
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Complete Compliance
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {' '}
              Operating System
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every capability is interconnected. Obligations flow to controls,
            controls trigger tasks, tasks produce evidence. One system. One
            truth.
          </p>
        </ScrollReveal>

        <div className="space-y-10">
          {capabilityCategories.map((category, catIdx) => {
            const categoryCapabilities = capabilities.slice(category.range[0], category.range[1]);
            return (
              <div key={category.label}>
                {/* Category label */}
                <ScrollReveal variant="fadeLeft" range={[catIdx * 0.06, 0.2 + catIdx * 0.06]}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-teal-500/40 to-transparent" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-teal-400/60">
                      {category.label}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                  </div>
                </ScrollReveal>

                <SectionChoreography pattern="stagger-wave" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryCapabilities.map((capability) => {
                    const Icon = capability.icon;
                    return (
                      <motion.div
                        key={capability.title}
                        whileHover={{ y: -4 }}
                        className="group relative p-6 rounded-xl bg-gray-950/50 border-l-2 border-l-white/10 border border-white/[0.04] hover:border-l-teal-500/50 transition-all cursor-pointer"
                      >
                        <div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                        />

                        <div className="flex items-start gap-4">
                          <div
                            className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${capability.color} flex-shrink-0 group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold mb-1.5 group-hover:text-teal-400 transition-colors">
                              {capability.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {capability.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </SectionChoreography>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
