'use client';

import {
  Clock,
  User,
  Link2,
  Archive,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false }
);

const evidenceProperties = [
  {
    number: '01',
    icon: Clock,
    title: 'Time-Stamped',
    description:
      'Every piece of evidence is time-stamped to show when it was created or updated.',
    detail: 'Immutable temporal records',
  },
  {
    number: '02',
    icon: User,
    title: 'User-Attributed',
    description:
      'Complete attribution chain from creation through every modification. Know exactly who did what.',
    detail: 'Full accountability trail',
  },
  {
    number: '03',
    icon: Link2,
    title: 'Control-Linked',
    description:
      'Evidence can be linked to specific controls and requirements to maintain compliance context.',
    detail: 'Compliance mapping context',
  },
  {
    number: '04',
    icon: Archive,
    title: 'Audit-Preserved',
    description:
      'Evidence updates are logged with a full audit trail; optional versioning is available by request.',
    detail: 'Audit history',
  },
];

export function EvidenceIntegrity() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-orange-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <FileCheck className="h-3 w-3 text-orange-400" />
            <span className="text-gray-300">Evidence Integrity</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Evidence that auditors</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              can actually trust.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            In governance, the quality of evidence determines the quality of
            decisions. FormaOS ensures every piece of evidence maintains its
            integrity from creation through audit.
          </p>
        </motion.div>

        {/* Evidence Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {evidenceProperties.map((property, index) => (
            <motion.div
              key={property.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-orange-500/30 transition-all duration-500"
            >
              {/* Number indicator */}
              <div className="absolute top-6 right-6">
                <span className="text-5xl font-bold text-white/[0.06] group-hover:text-orange-500/20 transition-colors duration-300">
                  {property.number}
                </span>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <property.icon className="h-7 w-7 text-orange-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-3">
                    {property.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <CheckCircle className="h-3 w-3 text-orange-400" />
                    <span className="text-xs font-medium text-orange-300">
                      {property.detail}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live audit trail demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 max-w-xl mx-auto"
        >
          <DemoAuditTrailCard glowColor="from-orange-500/15 to-amber-500/15" />
        </motion.div>

        {/* Quality Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'Full', label: 'Evidence Traceability' },
              { value: 'Enforced', label: 'Data Integrity Controls' },
              { value: 'Real-time', label: 'Activity Monitoring' },
              { value: 'Complete', label: 'Audit Coverage' },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
