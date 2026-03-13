'use client';

import { Shield, Lock, Users, UserCheck, Database } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const securityFeatures = [
  { label: 'SOC 2 Type II-aligned security controls', icon: Shield },
  { label: 'AES-256 encryption at rest, TLS 1.3 in transit', icon: Lock },
  { label: 'Google OAuth 2.0 + SAML 2.0 Enterprise SSO', icon: Users },
  { label: 'MFA enforcement (TOTP + hardware key support)', icon: UserCheck },
  { label: 'Immutable, tamper-evident audit logs', icon: Database },
  { label: 'RBAC with 4 organizational roles', icon: UserCheck },
  { label: 'Continuous compliance scoring engine', icon: Shield },
  { label: 'Correlation ID tracking for all system events', icon: Lock },
  {
    label: 'Session management, rate limiting, and IP controls',
    icon: Database,
  },
  { label: 'Data residency: AU default (US / EU on roadmap)', icon: Shield },
  { label: 'Independent penetration testing (planned)', icon: Lock },
  { label: 'Vendor assurance packet and DPA available', icon: Database },
] as const;

export function EnterpriseSecurity() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-8 sm:p-10">
            <div className="text-center mb-10">
              <span className="mk-badge mk-badge--section mb-5">
                Enterprise-Grade Security
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Security built into the operating layer
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                FormaOS is built for organizations under regulatory scrutiny.
                Security controls, identity governance, and audit infrastructure
                are core — not bolt-on features.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {securityFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/50"
                  >
                    <div className="inline-flex items-center justify-center rounded-lg border border-teal-400/20 bg-teal-500/10 p-2 shrink-0">
                      <Icon className="w-4 h-4 text-teal-400" />
                    </div>
                    <span className="text-sm text-slate-300 leading-snug">
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
