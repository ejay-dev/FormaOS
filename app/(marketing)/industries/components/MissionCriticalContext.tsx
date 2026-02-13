'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { duration, easing, stagger } from '@/config/motion';

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
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slower, ease: ([...easing.signature] as [number, number, number, number]) }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: duration.normal, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Industry Use
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Built for Environments Where
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {' '}
                Accountability Is Non-Negotiable
              </span>
            </h2>
          </motion.div>
        </Reveal>

        {/* Mission Critical Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower, delay: 0.2, ease: ([...easing.signature] as [number, number, number, number]) }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 sm:p-12"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
            When compliance failures have serious consequences
          </h3>

          <div className="grid sm:grid-cols-3 gap-8">
            {consequences.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: duration.normal, delay: index * stagger.normal, ease: ([...easing.signature] as [number, number, number, number]) }}
                className="text-center"
              >
                <div
                  className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-4`}
                />
                <p className="text-gray-400 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default MissionCriticalContext;
