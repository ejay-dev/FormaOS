'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  Shield,
  Lock,
  Eye,
  History,
  Key,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const SecurityWorkflowCard = dynamic(
  () => import('@/components/marketing/demo/SecurityWorkflowCard'),
  { ssr: false, loading: () => null }
);

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2-aligned controls',
    description: 'Security controls aligned to common trust frameworks',
  },
  {
    icon: Lock,
    title: 'Encryption at Rest & In Transit',
    description: 'AES-256 encryption at rest, TLS 1.3 in transit',
  },
  {
    icon: Eye,
    title: 'Complete Audit Logs',
    description: 'Every action tracked and timestamped',
  },
  {
    icon: History,
    title: 'Evidence Integrity',
    description:
      'Audit trail context protects evidence defensibility with full traceability',
  },
  {
    icon: Key,
    title: 'SSO & MFA',
    description: 'Google OAuth and MFA included; enterprise SSO (SAML) on roadmap',
  },
];

export function SecuritySection() {
  return (
    <section className="mk-section relative overflow-hidden">
      <AmbientParticleLayer intensity="subtle" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-cyan-500/5 rounded-full blur-2xl sm:blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <ScrollReveal variant="fadeLeft" range={[0, 0.35]}>
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-400 animate-pulse" />
              Enterprise Security
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Security Built Into
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                {' '}
                the Operating Layer
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              Controls are enforced, not just recorded. Every action is logged,
              evidence activity is tracked, and audit trails are complete.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 leading-relaxed">
              Security is infrastructure, not features. Built into the operating
              layer where controls execute automatically and evidence is
              captured at the system level.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <ScrollReveal
                    key={feature.title}
                    variant="blurIn"
                    range={[index * 0.04, 0.3 + index * 0.04]}
                  >
                    <div className="flex gap-3 sm:gap-4 group sm:hover:scale-105 transition-transform duration-200 will-change-transform">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center sm:group-hover:shadow-lg sm:group-hover:shadow-cyan-500/25 transition-shadow">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-cyan-300 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeRight" range={[0, 0.35]} className="flex items-center justify-center order-first lg:order-last">
            <div className="w-full max-w-[500px]">
              <SecurityWorkflowCard />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
