'use client';

import {
  Shield,
  TrendingUp,
  Settings,
  FileCheck,
  AlertTriangle,
  Users,
  Lock,
  Activity,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const audiences = [
  {
    icon: Shield,
    role: 'CCO / Head of Compliance',
    label:
      'Chief Compliance Officers building defensible governance infrastructure',
    detail: 'Control ownership, evidence trails, posture reporting',
  },
  {
    icon: Lock,
    role: 'CISO',
    label:
      'CISOs who need governance aligned to security controls and frameworks',
    detail: 'SOC 2, ISO 27001, Essential Eight alignment',
  },
  {
    icon: TrendingUp,
    role: 'CEO / Executive Leadership',
    label:
      'Executives accountable to regulators, boards, and public stakeholders',
    detail: 'Board-ready posture reports, executive dashboards',
  },
  {
    icon: Settings,
    role: 'Director of Operations',
    label:
      'Operations directors managing cross-site compliance and incident tracking',
    detail: 'Multi-entity oversight, workflow automation',
  },
  {
    icon: Activity,
    role: 'Risk & Audit Manager',
    label:
      'Risk managers who need real-time control visibility and gap analysis',
    detail: 'Gap detection, drift alerts, risk scoring',
  },
  {
    icon: Users,
    role: 'IT / Infrastructure Lead',
    label: 'IT teams implementing identity governance and access controls',
    detail: 'SAML SSO, RBAC, MFA enforcement (SCIM on roadmap)',
  },
  {
    icon: FileCheck,
    role: 'External / Internal Auditor',
    label: 'External auditors who demand structured, chain-of-custody evidence',
    detail: 'Auditor view, read-only evidence rooms',
  },
  {
    icon: AlertTriangle,
    role: 'Healthcare / NDIS / Financial Services',
    label: 'Regulated providers who cannot afford compliance failure',
    detail: 'Pre-built frameworks, audit-ready from day one',
  },
] as const;

export function WhoIsFor() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-12">
            <span className="mk-badge mk-badge--section mb-5">
              Who FormaOS Is For
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Built for those who{' '}
              <span className="text-teal-400">can&apos;t afford to guess</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Every role in a regulated organization has a stake in compliance.
              FormaOS gives each of them what they need.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <div
                  key={audience.role}
                  className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5"
                >
                  <div className="inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-2.5 mb-3">
                    <Icon className="w-4 h-4 text-teal-400" />
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400/70 mb-1.5">
                    {audience.role}
                  </div>
                  <p className="text-sm text-slate-300 leading-snug mb-2">
                    {audience.label}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {audience.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
