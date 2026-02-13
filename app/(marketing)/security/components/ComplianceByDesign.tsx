'use client';

import { Database, FileCheck, Archive, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';

const transparencyPrinciples = [
  {
    icon: Database,
    title: 'No Hidden State',
    description:
      "Every system state is visible, documented, and auditable. No background processes that can't be inspected. Complete transparency in how data flows through the system.",
    metrics: ['Complete State Visibility', 'Full Process Documentation'],
  },
  {
    icon: FileCheck,
    title: 'Traceable Actions',
    description:
      'Every action has a clear origin, destination, and rationale. From user input to system output, the complete chain is preserved and queryable.',
    metrics: ['End-to-End Tracing', 'Complete Audit Logs'],
  },
  {
    icon: Archive,
    title: 'Documented Outcomes',
    description:
      'Every decision, approval, and change is recorded with full context. Not just what happened, but why it happened and who was responsible.',
    metrics: ['Decision Context Capture', 'Responsibility Attribution'],
  },
];

export function ComplianceByDesign() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 left-1/3 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-amber-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute top-1/3 right-1/4 w-1/4 h-1/4 rounded-full bg-gradient-to-tl from-red-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <CheckCircle className="h-3 w-3 text-amber-400" />
            <span className="text-gray-300">Compliance by Design</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Transparency is not optional.</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 bg-clip-text text-transparent">
              It is the architecture.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            FormaOS is built on the principle that governance systems must be
            inherently transparent. Security through obscurity has no place in
            compliance.
          </p>
        </motion.div>

        {/* Transparency Principles */}
        <div className="space-y-6">
          {transparencyPrinciples.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: duration.slow }}
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10 hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <principle.icon className="h-8 w-8 text-amber-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {principle.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    {principle.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-3">
                    {principle.metrics.map((metric) => (
                      <div
                        key={metric}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
                      >
                        <CheckCircle className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-300">
                          {metric}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
