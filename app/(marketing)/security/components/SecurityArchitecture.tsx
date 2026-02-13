'use client';

import {
  Shield,
  Lock,
  Database,
  Users,
  FileCheck,
  Fingerprint,
  Key,
  Server,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';

const securityLayers = [
  {
    icon: Database,
    title: 'Encrypted Data Storage',
    description:
      'Encryption at rest and in transit with data isolation across tenants.',
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description:
      '6 role types with granular permissions. Principle of least privilege enforced across all actions.',
    color: 'from-orange-500/20 to-amber-500/20',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: Server,
    title: 'Multi-Tenant Isolation',
    description:
      'Complete data isolation between organizations via Row Level Security. Strict tenant boundary enforcement.',
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: FileCheck,
    title: 'Immutable Audit Logging',
    description:
      'Comprehensive audit trails that cannot be modified or deleted. Every action timestamped and attributed.',
    color: 'from-yellow-500/20 to-lime-500/20',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
];

const certifications = [
  {
    name: 'SOC 2-aligned',
    description: 'Security controls mapped to trust principles',
    icon: Shield,
  },
  {
    name: '7 Framework Packs',
    description: 'ISO 27001, SOC 2, HIPAA, GDPR, PCI-DSS, NIST CSF, CIS',
    icon: Lock,
  },
  {
    name: 'SSO & MFA',
    description: 'Google OAuth today; enterprise SSO/MFA by request',
    icon: Fingerprint,
  },
  {
    name: 'Evidence Integrity',
    description: 'Audit logs capture evidence activity and changes',
    icon: Key,
  },
];

export function SecurityArchitecture() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-red-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tl from-orange-500/20 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Lock className="h-3 w-3 text-red-400" />
            <span className="text-gray-300">Security Architecture</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Defense in depth.</span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Protection at every layer.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Our security architecture implements multiple layers of protection,
            ensuring that no single point of failure can compromise your data.
          </p>
        </motion.div>

        {/* Security Layers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20">
          {securityLayers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: duration.slow }}
              className={`group relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border ${layer.borderColor} p-8 hover:from-white/[0.12] hover:to-white/[0.04] transition-all duration-500`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${layer.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`}
              />

              <div className="flex items-start gap-5">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.color} border ${layer.borderColor} flex items-center justify-center`}
                >
                  <layer.icon className={`h-7 w-7 ${layer.iconColor}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {layer.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white mb-3">
              Compliance & Certifications
            </h3>
            <p className="text-gray-400">
              Enterprise-grade security aligned to leading standards
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group text-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <cert.icon className="h-6 w-6 text-red-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {cert.name}
                </h4>
                <p className="text-xs text-gray-500">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
