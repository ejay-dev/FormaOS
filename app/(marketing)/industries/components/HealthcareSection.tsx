'use client';

import { Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { duration, easing, stagger } from '@/config/motion';

export function HealthcareSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-l from-cyan-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              Healthcare & Allied Health
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Integrated Health Service
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                {' '}
                Compliance Frameworks
              </span>
            </h2>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              AHPRA registration, clinical governance, and safety requirements in
              one system
            </p>
          </motion.div>
        </Reveal>

        {/* Healthcare Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              {
                title: 'Clinical Governance',
                description:
                  'Evidence-based practice protocols, incident management, and quality improvement workflows aligned to NSQHS standards.',
              },
              {
                title: 'Professional Standards',
                description:
                  'AHPRA registration tracking, CPD management, and supervision documentation with review reminders.',
              },
              {
                title: 'Safety & Risk Management',
                description:
                  'Patient safety incident reporting, risk assessment workflows, and corrective action tracking with clinical review processes.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: duration.normal, delay: index * stagger.normal, ease: ([...easing.signature] as [number, number, number, number]) }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 p-6 transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: ([...easing.signature] as [number, number, number, number]) }}
            className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-white/[0.02] rounded-3xl border border-cyan-500/20 p-8"
          >
            <h4 className="text-xl font-bold text-white mb-6">
              Healthcare Framework Includes:
            </h4>
            <div className="space-y-3 text-sm text-gray-400 mb-8">
              {[
                'NSQHS Standards tracking templates',
                'Clinical incident and near-miss reporting workflows',
                'Medication management templates (by request)',
                'Infection prevention and control templates',
                'Patient rights and engagement workflows',
                'Clinical handover and communication templates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              Healthcare Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HealthcareSection;
