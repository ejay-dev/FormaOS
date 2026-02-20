'use client';

import { TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const outcomes = [
  'Continuous compliance, not periodic checks',
  'Reduced audit risk and preparation time',
  'Clear ownership of every obligation',
  'Defensible, regulator-ready evidence',
  'A governance system that actually runs',
];

export function TheOutcome() {
  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12">
            <div className="text-center mb-10">
              <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                  <TrendingUp className="w-4 h-4" />
                  The Outcome
                </div>
              </ScrollReveal>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                What Organizations Achieve with FormaOS
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {outcomes.map((outcome, index) => (
                <ScrollReveal
                  key={outcome}
                  variant="blurIn"
                  range={[index * 0.04, 0.3 + index * 0.04]}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">{outcome}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
