'use client';

import { Shield, Lock, Database, Users, FileCheck, Zap, Globe, Activity } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import dynamic from 'next/dynamic';
import { easing, duration } from '@/config/motion';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false }
);

const allPlansFeatures = [
  {
    icon: FileCheck,
    title: 'Immutable Audit Trail',
    description: 'Every action timestamped and tamper-evident — ready for regulator review',
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description: 'Versioned, encrypted, and chain-of-custody documentation for every control',
  },
  {
    icon: Shield,
    title: 'Workflow Governance',
    description: 'Enforce how compliance work is executed and owned, not just documented',
  },
  {
    icon: Lock,
    title: 'Role-Based Security',
    description: 'Granular access controls by role, function, and organizational boundary',
  },
  {
    icon: Users,
    title: 'Control Ownership',
    description: 'Every control assigned, tracked, and accountable to a named person or team',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Continuous compliance score with live drift detection across all frameworks',
  },
  {
    icon: Globe,
    title: 'Multi-Framework Support',
    description: 'ISO 27001, SOC 2, HIPAA, GDPR, NDIS, and more — mapped and maintained',
  },
];

export function AllPlansInclude() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 12,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <ScrollReveal variant="depthScale" range={[0, 0.35]} className="text-center mb-16">
          <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span className="text-gray-300">Core Foundation</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What All Plans Include
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Every FormaOS plan provides the foundations of a true compliance
            operating system
          </p>
        </ScrollReveal>

        {/* Features Grid */}
        <SectionChoreography pattern="center-burst" stagger={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allPlansFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -8,
                        scale: 1.05,
                        transition: { duration: duration.fast, ease: easing.smooth },
                      }
                }
                className="group relative text-center p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />

                {/* Icon container with pulse + glow on hover */}
                <div className="relative w-14 h-14 mx-auto mb-4">
                  {/* Glow ring behind icon – visible on hover */}
                  <div
                    className="absolute inset-[-6px] rounded-2xl bg-emerald-500/0 group-hover:bg-emerald-500/15 transition-all duration-500 blur-md"
                  />
                  <motion.div
                    className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center"
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            scale: [1, 1.15, 1.1],
                            boxShadow: [
                              '0 0 0px rgba(16,185,129,0)',
                              '0 0 18px rgba(16,185,129,0.4)',
                              '0 0 12px rgba(16,185,129,0.25)',
                            ],
                            transition: { duration: 0.6, ease: 'easeOut' },
                          }
                    }
                  >
                    <feature.icon className="w-7 h-7 text-emerald-400 transition-colors duration-300 group-hover:text-emerald-300" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
          ))}
        </SectionChoreography>

        {/* Compliance workflow preview */}
        <ScrollReveal variant="depthScale" range={[0.05, 0.4]} className="mt-12 max-w-xl mx-auto">
          <DemoComplianceChain glowColor="from-emerald-500/15 to-cyan-500/15" />
        </ScrollReveal>

        {/* Bottom Note */}
        <ScrollReveal variant="depthSlide" range={[0.1, 0.45]} className="mt-16 backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 text-center">
          <p className="text-gray-400 text-base">
            Every plan delivers the core compliance operating layer your team needs.
            <span className="text-emerald-400 font-medium ml-1">
              No tier compromises regulatory defensibility.
            </span>
            {' '}Upgrade or downgrade with full data portability, no penalty.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
