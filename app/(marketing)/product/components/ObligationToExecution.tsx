'use client';

import { ArrowRight, CheckCircle, Activity, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(() => import('@/components/marketing/demo/DemoComplianceChain'), { ssr: false });

const flow = [
  { step: 'Obligations', becomes: 'structured controls', color: 'from-cyan-500 to-blue-500' },
  { step: 'Controls', becomes: 'owned tasks', color: 'from-blue-500 to-purple-500' },
  { step: 'Tasks', becomes: 'live evidence', color: 'from-purple-500 to-pink-500' },
  { step: 'Evidence', becomes: 'complete audit trail', color: 'from-pink-500 to-rose-500' },
];

export function ObligationToExecution() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            From Obligation to Execution
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            You Don't Just Record
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              {' '}
              Compliance. You Run It.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Most compliance platforms stop at documentation. FormaOS goes
            further. It operationalizes compliance across your organization.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flow.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
                <div className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-semibold mb-4`}>
                  {item.step}
                </div>
                <p className="text-gray-400">
                  become{' '}
                  <span className="text-white font-medium">{item.becomes}</span>
                </p>
              </div>
              {index < flow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <DemoComplianceChain glowColor="from-purple-500/15 to-pink-500/15" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 grid sm:grid-cols-3 gap-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4 text-cyan-400" />
            Every action is tracked
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <UserCheck className="w-4 h-4 text-blue-400" />
            Every control has an owner
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Every outcome is provable
          </div>
        </motion.div>
      </div>
    </section>
  );
}
