'use client';

import { motion } from 'framer-motion';
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
      '8 automation triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation notifications.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Database,
    title: 'Evidence Versioning',
    description:
      'Evidence activity is logged with audit trail context. Optional versioning and rollback available by request.',
    color: 'from-blue-500 to-purple-500',
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
      'REST API v1 for compliance data, evidence uploads, and tasks. Webhooks available by request.',
    color: 'from-yellow-500 to-green-500',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Planned enterprise roadmap: multi-site hierarchies, business units, and cross-site rollups.',
    color: 'from-green-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Block non-compliant actions before they happen. Real-time validation ensures controls are satisfied before proceeding.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: ScanSearch,
    title: 'Automated Compliance Gap Analysis',
    description:
      'Scan across 6 frameworks simultaneously to identify compliance gaps, missing evidence, and control weaknesses before auditors do.',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    icon: FileStack,
    title: 'Full Document Version History',
    description:
      'Every document change is tracked with complete version history. Compare revisions, restore previous versions, and maintain audit-ready records.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Activity,
    title: 'Live Compliance Activity Stream',
    description:
      'Real-time feed of compliance events across your organization. Track evidence uploads, task completions, and control changes as they happen.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: ShieldAlert,
    title: 'Threat Correlation Engine',
    description:
      'Correlate security events across your compliance infrastructure. Detect patterns, flag anomalies, and surface risks before they escalate.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Building,
    title: 'Multi-Site Compliance',
    description:
      'Manage compliance across multiple entities, business units, and locations with centralized oversight and per-site controls.',
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

export function CapabilitiesGrid() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Platform Capabilities
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Complete Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              {' '}
              Operating System
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every capability is interconnected. Obligations flow to controls,
            controls trigger tasks, tasks produce evidence. One system. One
            truth.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${capability.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-400 transition-colors">
                  {capability.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
