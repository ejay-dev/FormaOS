'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

export function ValueProposition() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal variant="blurIn" range={[0, 0.3]}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Operating System Architecture
          </div>
        </ScrollReveal>

        <ScrollReveal variant="staggerFade" range={[0, 0.35]}>
          <p className="text-lg sm:text-xl text-gray-400 mb-6 leading-relaxed">
            FormaOS is the operating system that runs your compliance program.
            Not a repository. Not a checklist. A live system that enforces
            governance, tracks accountability, and produces defensible evidence.
          </p>

          <p className="text-sm text-gray-500 mb-12 max-w-2xl mx-auto">
            Real-time compliance state. Immutable evidence chains.
            System-enforced accountability, not spreadsheet-level tracking.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <ScrollReveal variant="fadeLeft" range={[0, 0.35]}>
            <motion.div
              whileHover={{ y: -4 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-red-500/20 transition-all duration-500 group"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                Other tools store documents.
              </h3>
              <p className="text-gray-500 mb-4">
                Static repositories. Manual reminders. Evidence scattered across
                folders. Hope the auditor doesn&apos;t ask the hard questions.
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  No control enforcement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Point-in-time snapshots
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Manual evidence collection
                </li>
              </ul>
            </motion.div>
          </ScrollReveal>

          <ScrollReveal variant="fadeRight" range={[0, 0.35]}>
            <motion.div
              whileHover={{ y: -4 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 group shadow-lg shadow-cyan-500/5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                FormaOS runs your program.
              </h3>
              <p className="text-gray-500 mb-4">
                A live operating system. Controls are enforced, not just
                recorded. Evidence is automatic. Accountability is system-level.
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Workflow orchestration built-in
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Real-time compliance posture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Immutable audit trail
                </li>
              </ul>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
