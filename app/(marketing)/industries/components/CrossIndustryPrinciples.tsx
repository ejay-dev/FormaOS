'use client';

import {
  FileCheck,
  Shield,
  Activity,
  Zap,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const DemoWorkflowTimeline = dynamic(
  () => import('@/components/marketing/demo/DemoWorkflowTimeline'),
  { ssr: false },
);

const principles = [
  {
    number: '1',
    icon: FileCheck,
    title: 'Obligations are structured as system logic',
    description:
      'Regulatory requirements become enforceable workflows, not checklists',
    color: 'from-indigo-500 to-blue-500',
    iconBg: 'from-indigo-500/20 to-indigo-500/10',
    iconBorder: 'border-indigo-500/20',
    iconColor: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-400',
  },
  {
    number: '2',
    icon: Shield,
    title: 'Controls are enforced operationally',
    description:
      'Compliance happens through daily work, not separate activities',
    color: 'from-green-500 to-emerald-500',
    iconBg: 'from-green-500/20 to-green-500/10',
    iconBorder: 'border-green-500/20',
    iconColor: 'text-green-400',
    hoverColor: 'group-hover:text-green-400',
  },
  {
    number: '3',
    icon: Activity,
    title: 'Evidence is captured continuously',
    description:
      'Proof of compliance accumulates as workflows are completed',
    color: 'from-purple-500 to-violet-500',
    iconBg: 'from-purple-500/20 to-purple-500/10',
    iconBorder: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    hoverColor: 'group-hover:text-purple-400',
  },
  {
    number: '4',
    icon: Zap,
    title: 'Audits become reporting, not reconstruction',
    description:
      'Audit trails are available for inspection and reporting',
    color: 'from-orange-500 to-red-500',
    iconBg: 'from-orange-500/20 to-orange-500/10',
    iconBorder: 'border-orange-500/20',
    iconColor: 'text-orange-400',
    hoverColor: 'group-hover:text-orange-400',
  },
];

export function CrossIndustryPrinciples() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Why It Works Across Industries
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Universal Compliance
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
                {' '}
                Design Principles
              </span>
            </h2>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Four core principles that make FormaOS effective across all
              regulated environments
            </p>
          </div>
        </ScrollReveal>

        {/* Principles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <ScrollReveal key={principle.title} variant="scaleUp" range={[index * 0.04, 0.3 + index * 0.04]}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group text-center backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] hover:border-purple-500/30 p-6 transition-all duration-300"
                >
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.iconBg} ${principle.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`h-8 w-8 ${principle.iconColor}`} />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${principle.color} text-white text-xs font-bold flex items-center justify-center`}
                      >
                        {principle.number}
                      </div>
                    </div>
                  </div>

                  <h4
                    className={`font-bold text-base mb-3 text-white ${principle.hoverColor} transition-colors duration-300`}
                  >
                    {principle.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {principle.description}
                  </p>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Live compliance workflow demo */}
        <ScrollReveal variant="fadeUp" range={[0.04, 0.38]}>
          <div className="mb-12 max-w-2xl mx-auto">
            <DemoWorkflowTimeline
              steps={[
                { id: 'map', label: 'Map', icon: FileCheck, title: 'Framework Mapped', detail: 'Industry obligations imported automatically', meta: 'Supports NDIS, AHPRA, ISO, SOC 2, HIPAA', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20' },
                { id: 'assign', label: 'Assign', icon: Users, title: 'Ownership Assigned', detail: 'Every control linked to an accountable person', meta: 'Role-based • Escalation rules • Delegation', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
                { id: 'execute', label: 'Execute', icon: Zap, title: 'Tasks Executed', detail: 'Compliance work happens inside the platform', meta: 'Automated reminders • Due dates • Priorities', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
                { id: 'prove', label: 'Prove', icon: Shield, title: 'Audit-Ready', detail: 'Full evidence chain for any regulator', meta: 'Immutable trail • Exportable • Zero gaps', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
              ]}
              glowColor="from-purple-500/15 to-pink-500/15"
            />
          </div>
        </ScrollReveal>

        {/* Design Philosophy Statement */}
        <ScrollReveal variant="slideUp" range={[0.06, 0.4]}>
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 sm:p-12 text-center"
          >
            <h4 className="text-xl font-bold mb-4 text-white">
              This design philosophy makes FormaOS effective across any regulatory
              environment
            </h4>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Whether managing NDIS obligations, healthcare accreditation,
              financial regulations, or construction safety – the core principle
              remains the same: compliance should be operational, not
              administrative.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default CrossIndustryPrinciples;
