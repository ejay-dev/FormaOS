'use client';

import { Shield, TrendingUp, Settings, FileCheck, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const audiences = [
  { label: 'Compliance leaders who need certainty', icon: Shield },
  { label: 'Executives who need defensibility', icon: TrendingUp },
  { label: 'Operations teams who need clarity', icon: Settings },
  { label: 'Auditors who demand evidence', icon: FileCheck },
  { label: 'Organizations that cannot afford failure', icon: AlertTriangle },
];

export function WhoIsFor() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6"
          >
            <Users className="w-4 h-4" />
            Who FormaOS Is For
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Built for Those Who
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {' '}Can't Afford to Guess
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
              >
                <Icon className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-gray-300">{audience.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
