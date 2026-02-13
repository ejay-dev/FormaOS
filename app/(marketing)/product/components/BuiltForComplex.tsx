'use client';

import { Building2, Globe, GitBranch, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';

const scales = [
  { label: 'Multi-site operations', icon: Globe },
  { label: 'Cross-departmental governance', icon: GitBranch },
  { label: 'External auditors and regulators', icon: Users },
  { label: 'Executive oversight', icon: Eye },
];

export function BuiltForComplex() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
          >
            <Building2 className="w-4 h-4" />
            Built for Complex Organizations
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            One System. One Source of Truth.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Whether you manage one site or hundreds, FormaOS scales across:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {scales.map((scale, index) => {
              const Icon = scale.icon;
              return (
                <motion.div
                  key={scale.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-gray-300">{scale.label}</span>
                </motion.div>
              );
            })}
          </div>

          <p className="text-lg font-medium text-white">Full organizational alignment.</p>
        </motion.div>
      </div>
    </section>
  );
}
