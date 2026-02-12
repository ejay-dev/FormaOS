'use client';

import { motion } from 'framer-motion';

const trustedBy = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services teams',
  'Education & research',
  'Government programs',
  'Community services',
  'Enterprise compliance',
  'Multi-site operators',
];

export function TrustSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-[#0a0f1c] to-[#080c16] border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-8">
            Built for regulated teams
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustedBy.map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer shadow-lg shadow-black/10"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/40 to-transparent transition-all duration-500" />

              <span className="relative text-gray-400 group-hover:text-cyan-400 transition-colors duration-300 text-sm font-medium text-center">
                {company}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: 'Reliable uptime', label: 'High availability' },
            { value: 'Evidence-first', label: 'Operational traceability' },
            { value: 'Audit-ready', label: 'Continuous readiness' },
            { value: 'Fast access', label: 'Retrieval at speed' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default"
            >
              <motion.div
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.15 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
