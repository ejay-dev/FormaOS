'use client';

import { Shield, Lock, Database, Users, FileCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false }
);

const allPlansFeatures = [
  {
    icon: FileCheck,
    title: 'Immutable Audit Trail',
    description: 'Every action recorded and time-stamped',
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description: 'Versioned, secure, and defensible documentation',
  },
  {
    icon: Shield,
    title: 'Workflow Governance',
    description: 'Enforce how work is executed, not just recorded',
  },
  {
    icon: Lock,
    title: 'Role-Based Security',
    description: 'Strict access controls by function and responsibility',
  },
  {
    icon: Users,
    title: 'Operational Transparency',
    description: 'Real-time insight into compliance activity',
  },
];

export function AllPlansInclude() {
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
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Zap className="h-3 w-3 text-cyan-400" />
            <span className="text-gray-300">Core Foundation</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What All Plans Include
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Every FormaOS plan provides the foundations of a true compliance
            operating system
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {allPlansFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group text-center p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />

              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Compliance workflow preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 max-w-xl mx-auto"
        >
          <DemoComplianceChain glowColor="from-emerald-500/15 to-cyan-500/15" />
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-3xl border border-white/10 p-8 text-center"
        >
          <p className="text-gray-400 text-base">
            No tier compromises your ability to meet regulatory expectations.
            <span className="text-emerald-400 font-medium ml-1">
              Upgrade or downgrade anytime.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
