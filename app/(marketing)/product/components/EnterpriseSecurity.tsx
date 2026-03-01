'use client';

import { Shield, Lock, Users, UserCheck, Database } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const securityFeatures = [
  { label: 'SOC 2 Type II-aligned security controls', icon: Shield },
  { label: 'AES-256 encryption at rest, TLS 1.3 in transit', icon: Lock },
  { label: 'Google OAuth 2.0 + SAML 2.0 Enterprise SSO', icon: Users },
  { label: 'MFA enforcement (TOTP + hardware key support)', icon: UserCheck },
  { label: 'Immutable, tamper-evident audit logs', icon: Database },
  { label: 'RBAC with 4 organizational roles', icon: UserCheck },
  { label: 'Continuous compliance scoring engine', icon: Shield },
  { label: 'Correlation ID tracking for all system events', icon: Lock },
  { label: 'Session management, rate limiting, and IP controls', icon: Database },
  { label: 'Data residency controls (AU / US / EU)', icon: Shield },
  { label: 'Annual independent penetration testing', icon: Lock },
  { label: 'Vendor assurance packet and DPA available', icon: Database },
] as const;

export function EnterpriseSecurity() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Subtle section tint */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.03] to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent" />

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-sm font-medium mb-5">
                <Shield className="w-4 h-4" />
                Enterprise-Grade Security
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Security built into the operating layer
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                FormaOS is built for organizations under regulatory scrutiny. Security controls, identity governance, and audit infrastructure are core — not bolt-on features.
              </p>
            </div>

            <SectionChoreography pattern="cascade" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {securityFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:border-teal-400/15 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div className="inline-flex items-center justify-center rounded-lg border border-teal-400/20 bg-teal-500/10 p-2 shrink-0">
                      <Icon className="w-4 h-4 text-teal-400" />
                    </div>
                    <span className="text-sm text-slate-300 leading-snug">{feature.label}</span>
                  </div>
                );
              })}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
