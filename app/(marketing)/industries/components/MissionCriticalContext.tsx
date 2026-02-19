'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const consequences = [
  { label: 'Legal liability and penalties', color: 'bg-rose-400' },
  { label: 'License suspension or revocation', color: 'bg-orange-400' },
  { label: 'Reputational and operational damage', color: 'bg-amber-400' },
];

export function MissionCriticalContext() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Industry Use
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Built for Environments Where
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {' '}
                Accountability Is Non-Negotiable
              </span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Mission Critical Card */}
        <ScrollReveal variant="fadeUp" range={[0.04, 0.38]}>
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 sm:p-12"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
              When compliance failures have serious consequences
            </h3>

            <div className="grid sm:grid-cols-3 gap-8">
              {consequences.map((item, index) => (
                <ScrollReveal key={item.label} variant="fadeUp" range={[index * 0.04, 0.3 + index * 0.04]}>
                  <div className="text-center">
                    <div
                      className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-4`}
                    />
                    <p className="text-gray-400 font-medium">{item.label}</p>
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

export default MissionCriticalContext;
