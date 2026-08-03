'use client';

import { FileCheck, Shield, Activity, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const DemoWorkflowTimeline = dynamic(
  () => import('@/components/marketing/demo/DemoWorkflowTimeline'),
  { ssr: false },
);

const principles = [
  {
    icon: FileCheck,
    title: 'Obligations are structured as system logic',
    description:
      'Regulatory requirements become enforceable workflows, not checklists',
    iconBg: 'from-zinc-700/20 to-zinc-700/10',
    iconBorder: 'border-zinc-600/20',
    iconColor: 'text-zinc-300',
    hoverColor: 'group-hover:text-zinc-300',
  },
  {
    icon: Shield,
    title: 'Controls are enforced operationally',
    description:
      'Compliance happens through daily work, not separate activities',
    iconBg: 'from-zinc-700/20 to-zinc-700/10',
    iconBorder: 'border-zinc-600/20',
    iconColor: 'text-zinc-300',
    hoverColor: 'group-hover:text-zinc-300',
  },
  {
    icon: Activity,
    title: 'Evidence is captured continuously',
    description: 'Proof of compliance accumulates as workflows are completed',
    iconBg: 'from-zinc-700/20 to-zinc-700/10',
    iconBorder: 'border-zinc-600/20',
    iconColor: 'text-zinc-300',
    hoverColor: 'group-hover:text-zinc-300',
  },
  {
    icon: Zap,
    title: 'Audits become reporting, not reconstruction',
    description: 'Audit trails are available for inspection and reporting',
    iconBg: 'from-zinc-700/20 to-zinc-700/10',
    iconBorder: 'border-zinc-600/20',
    iconColor: 'text-zinc-300',
    hoverColor: 'group-hover:text-zinc-300',
  },
];

export function CrossIndustryPrinciples() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="mb-14 flex items-start gap-5">
            <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Universal compliance{' '}
                <span className="text-slate-400">design principles</span>
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Four core principles that make FormaOS effective across all
                regulated environments.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Principles Grid */}
        <SectionChoreography
          pattern="stagger-wave"
          stagger={0.05}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <motion.div
                key={principle.title}
                whileHover={{ y: -4 }}
                className="group text-center bg-white/[0.03] rounded-2xl border border-white/[0.08] hover:border-white/20 p-6 transition-all duration-300"
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.iconBg} ${principle.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`h-8 w-8 ${principle.iconColor}`} />
                    </div>
                  </div>
                </div>

                <h4
                  className={`font-bold text-base mb-3 text-white ${principle.hoverColor} transition-colors duration-300`}
                >
                  {principle.title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {principle.description}
                </p>
              </motion.div>
            );
          })}
        </SectionChoreography>

        {/* Live compliance workflow demo */}
        <ScrollReveal variant="fadeUp" range={[0.04, 0.38]}>
          <div className="mb-12 max-w-2xl mx-auto">
            <DemoWorkflowTimeline
              steps={[
                {
                  id: 'map',
                  label: 'Map',
                  icon: FileCheck,
                  title: 'Framework Mapped',
                  detail: 'Industry obligations imported automatically',
                  meta: 'Supports NDIS, AHPRA, ISO, SOC 2, HIPAA',
                  color: 'text-slate-300',
                  bg: 'bg-white/[0.08]',
                  border: 'border-white/15',
                },
                {
                  id: 'assign',
                  label: 'Assign',
                  icon: Users,
                  title: 'Ownership Assigned',
                  detail: 'Every control linked to an accountable person',
                  meta: 'Role-based • Escalation rules • Delegation',
                  color: 'text-slate-300',
                  bg: 'bg-white/[0.08]',
                  border: 'border-white/15',
                },
                {
                  id: 'execute',
                  label: 'Execute',
                  icon: Zap,
                  title: 'Tasks Executed',
                  detail: 'Compliance work happens inside the platform',
                  meta: 'Automated reminders • Due dates • Priorities',
                  color: 'text-slate-300',
                  bg: 'bg-white/[0.08]',
                  border: 'border-white/15',
                },
                {
                  id: 'prove',
                  label: 'Prove',
                  icon: Shield,
                  title: 'Audit-Ready',
                  detail: 'Full evidence chain for any regulator',
                  meta: 'Immutable trail • Exportable • Zero gaps',
                  color: 'text-slate-300',
                  bg: 'bg-white/[0.08]',
                  border: 'border-white/15',
                },
              ]}
              glowColor="from-white/[0.06] to-white/[0.03]"
            />
          </div>
        </ScrollReveal>

        {/* Design Philosophy Statement */}
        <ScrollReveal variant="slideUp" range={[0.06, 0.4]}>
          <div className="bg-white/[0.03] rounded-3xl border border-white/[0.08] p-8 sm:p-12 text-center">
            <h4 className="text-xl font-bold mb-4 text-white">
              This design philosophy makes FormaOS effective across any
              regulatory environment
            </h4>
            <p className="text-slate-400 max-w-3xl mx-auto">
              Whether managing NDIS obligations, healthcare accreditation,
              financial regulations, or construction safety, the core principle
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
