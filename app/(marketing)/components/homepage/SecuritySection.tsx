'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import {
  Shield,
  Lock,
  Eye,
  History,
  Key,
  BadgeCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const SecurityWorkflowCard = dynamic(
  () => import('@/components/marketing/demo/SecurityWorkflowCard'),
  { ssr: false, loading: () => null }
);

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2 Type II-aligned controls',
    description: 'Security controls mapped to Common Criteria, Availability, and Confidentiality trust service categories',
    badge: 'SOC 2',
  },
  {
    icon: Lock,
    title: 'AES-256 + TLS 1.3 encryption',
    description: 'Data encrypted at rest with AES-256, in transit with TLS 1.3 — no exceptions',
    badge: 'AES-256',
  },
  {
    icon: Eye,
    title: 'Tamper-evident audit logs',
    description: 'Immutable, timestamped action logs for every compliance event — ready for regulator review',
    badge: 'Immutable',
  },
  {
    icon: History,
    title: 'Evidence chain of custody',
    description: 'Every evidence item linked to its owner, workflow, approval, and timestamp — full defensibility trail',
    badge: 'Traceable',
  },
  {
    icon: Key,
    title: 'SAML 2.0 SSO + MFA enforcement',
    description: 'Google OAuth on all plans; SAML enterprise SSO for Okta and Azure AD; MFA policy enforcement',
    badge: 'Enterprise',
  },
  {
    icon: BadgeCheck,
    title: 'Data residency controls',
    description: 'AU-based hosting by default; US and EU residency options for enterprise deployments',
    badge: 'Sovereignty',
  },
];

export function SecuritySection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      {/* Proof section treatment: monochrome, high-contrast, no color gradients */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.04]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.04]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <ScrollReveal variant="depthScale" range={[0, 0.35]}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <BadgeCheck className="w-3.5 h-3.5" />
                Enterprise Security
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">
                Security Built Into
                <span className="text-white/60">
                  {' '}the Operating Layer
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                Controls are enforced, not just recorded. Security is embedded at the operating layer — where compliance evidence is generated automatically and audit trails are always complete.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 leading-relaxed">
                FormaOS ships with enterprise security controls as infrastructure: encryption, identity governance, immutable audit logs, and data residency — ready for your procurement team before the first question is asked.
              </p>

              {/* Security features: monochrome cards with proof badges */}
              <SectionChoreography pattern="depth-reveal" stagger={0.04} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {securityFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="home-panel home-panel--soft group flex gap-3 sm:gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                        <Icon className="w-5 h-5 sm:w-5 sm:h-5 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm sm:text-base text-white/90 truncate">
                            {feature.title}
                          </h3>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5">
                            {feature.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </SectionChoreography>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="depthScale" range={[0, 0.35]} className="flex items-center justify-center order-first lg:order-last">
            <div className="home-panel home-panel--strong w-full max-w-[500px] rounded-2xl p-2">
              <SecurityWorkflowCard />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
