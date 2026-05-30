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
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

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
    detail: 'SAML SSO, RBAC, MFA enforcement, and deployment planning',
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
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="text-center mb-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Who FormaOS Is For
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Built for those who{' '}
              <span className="text-foreground">
                can't afford to guess
              </span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Every role in a regulated organization has a stake in compliance.
              FormaOS gives each of them what they need.
            </p>
          </div>
        </ScrollReveal>

        <SectionChoreography
          pattern="stagger-wave"
          stagger={0.05}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.role}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden relative"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 group-hover:via-white/15 to-transparent transition-all duration-500" />

                <div className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] p-2.5 mb-3">
                  <Icon className="w-4 h-4 text-slate-300" />
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {audience.role}
                </div>
                <p className="text-sm text-slate-300 leading-snug mb-2">
                  {audience.label}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {audience.detail}
                </p>
              </motion.div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}
