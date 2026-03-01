'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { TrendingDown, TrendingUp } from 'lucide-react';

const BEFORE_ITEMS = [
  'No control enforcement — just documentation',
  'Point-in-time snapshots, not continuous posture',
  'Manual evidence collection before every audit',
  'Ownership is assumed, not assigned or enforced',
  'No single source of truth when regulators ask',
] as const;

const AFTER_ITEMS = [
  'Workflow enforcement — controls block non-compliance',
  'Real-time continuous compliance posture',
  'Immutable, timestamped audit trail',
  'Every control owned by a named person or team',
  'Audit packets ready to export in minutes',
] as const;

export function ValueProposition() {
  return (
    <section className="mk-section home-section home-section--contrast relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-12">
          <ScrollReveal variant="slideUp" range={[0, 0.3]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Operating System Architecture
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built different. Works different.
            </h2>

            <p className="text-base sm:text-lg text-slate-400 mb-4 leading-relaxed max-w-2xl mx-auto">
              FormaOS is the operating system that runs your compliance program.
              Not a repository. Not a checklist. A live system that enforces
              governance, tracks accountability, and produces defensible evidence.
            </p>

            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Real-time compliance state. Immutable evidence chains.
              System-enforced accountability, not spreadsheet-level tracking.
            </p>
          </ScrollReveal>
        </div>

        {/* Before / After comparison */}
        <div className="grid md:grid-cols-2 gap-6 text-left">
          {/* Before */}
          <ScrollReveal variant="fadeLeft" range={[0, 0.35]}>
            <motion.div
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-rose-500/10 bg-rose-500/[0.03] p-6 transition-all duration-300 group overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </span>
                Other tools store documents.
              </h3>
              <p className="text-slate-500 text-sm mb-5 mt-3 leading-relaxed">
                Static repositories. Spreadsheets passed around. Evidence reconstructed days before audits. Ownership documented nowhere.
              </p>
              <ul className="space-y-2">
                {BEFORE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-slate-500">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </ScrollReveal>

          {/* After */}
          <ScrollReveal variant="fadeRight" range={[0, 0.35]}>
            <motion.div
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-teal-400/15 bg-teal-500/[0.04] p-6 transition-all duration-300 group overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

              <h3 className="text-base font-semibold text-teal-300 mb-1 flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center rounded-lg border border-teal-400/20 bg-teal-500/10 p-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                </span>
                FormaOS runs your program.
              </h3>
              <p className="text-slate-400 text-sm mb-5 mt-3 leading-relaxed">
                A live operating layer. Controls are enforced before work proceeds. Evidence is generated as teams operate. Accountability is structural — not cultural.
              </p>
              <ul className="space-y-2">
                {AFTER_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
