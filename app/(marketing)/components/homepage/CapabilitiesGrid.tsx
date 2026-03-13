'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  Workflow,
  Database,
  Lock,
  GitBranch,
  Layers,
  Terminal,
  Eye,
  Code2,
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
import type { LucideIcon } from 'lucide-react';

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
}

const capabilities: Capability[] = [
  {
    icon: Workflow,
    title: 'Automation Engine',
    description:
      'Automation triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation notifications.',
  },
  {
    icon: Database,
    title: 'Evidence Versioning',
    description:
      'Evidence activity is logged with full audit trail context. Every upload, review, and approval is tracked for compliance readiness.',
  },
  {
    icon: Lock,
    title: 'Compliance Score Engine',
    description:
      'Continuous compliance scoring with trend insights and snapshot history when enabled.',
  },
  {
    icon: GitBranch,
    title: 'Framework Packs',
    description:
      '7 pre-built frameworks: ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls. NDIS Practice Standards and Essential Eight available as industry add-ons.',
  },
  {
    icon: Layers,
    title: 'Cross-Framework Mapping',
    description:
      'Control mappings across SOC 2, NIST CSF, and CIS Controls with coverage visibility.',
  },
  {
    icon: Terminal,
    title: 'Compliance Intelligence',
    description:
      'Real-time compliance scoring with trend analysis and risk insights across all frameworks.',
  },
  {
    icon: Eye,
    title: 'Executive Dashboard',
    description:
      'C-level visibility into compliance posture, framework health, and risk trends.',
  },
  {
    icon: Code2,
    title: 'REST API v1',
    description:
      'REST API v1 for compliance data, evidence uploads, and task management. Webhook endpoints deliver real-time event notifications to your SIEM or existing tooling.',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Multi-entity and multi-site operations with centralized oversight. Each entity maintains its own controls, evidence, and audit trail - with cross-site rollup reporting for executive governance.',
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Block non-compliant actions before they happen. Real-time validation ensures controls are satisfied before proceeding.',
  },
  {
    icon: ScanSearch,
    title: 'Automated Gap Analysis',
    description:
      'Run gap analysis per framework to identify compliance gaps, missing evidence, and control weaknesses before auditors do.',
  },
  {
    icon: FileStack,
    title: 'Document Audit Trail',
    description:
      'Every document change is tracked with a complete audit log. Maintain audit-ready records with full visibility into who changed what and when.',
  },
  {
    icon: Activity,
    title: 'Compliance Activity Logging',
    description:
      'Comprehensive logging of compliance events across your organization. Track evidence uploads, task completions, and control changes.',
  },
  {
    icon: ShieldAlert,
    title: 'Security Event Tracking',
    description:
      'Track and correlate security events across your compliance infrastructure with request-level correlation IDs and structured logging.',
  },
  {
    icon: Building,
    title: 'Multi-Entity Compliance',
    description:
      'Manage compliance across multiple entities with centralized oversight and organization-scoped controls and evidence.',
  },
  {
    icon: ClipboardList,
    title: 'Operational Registers',
    description:
      'Built-in training registers and asset registers to track staff certifications, equipment, and operational readiness in one place.',
  },
  {
    icon: HeartPulse,
    title: 'Healthcare & Patient Management',
    description:
      'Purpose-built modules for progress notes, patient management, and clinical workflows designed for healthcare and allied health providers.',
  },
];

const categories = [
  { label: 'Core Engine', range: [0, 4] as const },
  { label: 'Framework Intelligence', range: [4, 8] as const },
  { label: 'Operational Infrastructure', range: [8, 12] as const },
  { label: 'Domain Modules', range: [12, 16] as const },
];

export function CapabilitiesGrid() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp" className="text-center mb-16">
          <span className="mk-badge mk-badge--section mb-6">
            Platform Capabilities
          </span>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Complete Compliance{' '}
            <span className="text-teal-400">Operating System</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every capability is interconnected. Obligations flow to controls,
            controls trigger tasks, tasks produce evidence. One system. One
            truth.
          </p>
        </ScrollReveal>

        <div className="space-y-14">
          {categories.map((category) => {
            const items = capabilities.slice(
              category.range[0],
              category.range[1],
            );
            const [feature, ...supporting] = items;
            const FeatureIcon = feature.icon;

            return (
              <ScrollReveal key={category.label} variant="fadeUp">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {category.label}
                  </span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <div className="grid lg:grid-cols-2 gap-3">
                  {/* Tier 1 — Feature capability */}
                  <div className="p-6 rounded-xl bg-slate-900/60 border border-white/[0.08] lg:row-span-2">
                    <div className="inline-flex p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 mb-4">
                      <FeatureIcon className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Tier 2 — Supporting capabilities */}
                  {supporting.map((capability) => {
                    const Icon = capability.icon;
                    return (
                      <div
                        key={capability.title}
                        className="group flex gap-3 p-4 rounded-xl bg-slate-900/40 border border-white/[0.05] hover:border-white/[0.08] transition-colors duration-200"
                      >
                        <div className="inline-flex p-2 rounded-lg bg-slate-800/60 border border-white/[0.06] shrink-0 self-start">
                          <Icon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white mb-0.5">
                            {capability.title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {capability.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
