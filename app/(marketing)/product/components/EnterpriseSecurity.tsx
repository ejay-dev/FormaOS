'use client';

import { Shield, Lock, Users, UserCheck, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const securityFeatures = [
  { label: 'SOC 2-aligned controls', icon: Shield },
  {
    label: 'Encryption at rest (AES-256) and in transit (TLS 1.3)',
    icon: Lock,
  },
  { label: 'Google OAuth + Enterprise SSO (SAML)', icon: Users },
  { label: 'MFA (TOTP + backup codes)', icon: UserCheck },
  { label: 'Immutable Audit Logs', icon: Database },
  { label: 'Role-Based Access Control (4 Roles)', icon: UserCheck },
  { label: 'Automated compliance score engine', icon: Shield },
  { label: 'Correlation ID tracking', icon: Lock },
  { label: 'Session management & rate limiting', icon: Database },
];

export function EnterpriseSecurity() {
  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12">
            <div className="text-center mb-10">
              <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
                  <Shield className="w-4 h-4" />
                  Enterprise-Grade Security
                </div>
              </ScrollReveal>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Built for Regulated Organizations
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Security is embedded at the operating layer, not added as a
                feature.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <ScrollReveal
                    key={feature.label}
                    variant="fadeUp"
                    range={[index * 0.04, 0.3 + index * 0.04]}
                  >
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-sm text-gray-300">{feature.label}</span>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
