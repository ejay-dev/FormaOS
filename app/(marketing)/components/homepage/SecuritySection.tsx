'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import {
  Shield,
  Lock,
  Eye,
  History,
  Key,
  BadgeCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FileLock2,
  ClipboardCheck,
} from 'lucide-react';

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2 Type II-aligned controls',
    description:
      'Security controls mapped to Common Criteria, Availability, and Confidentiality trust service categories',
    badge: 'SOC 2',
  },
  {
    icon: Lock,
    title: 'AES-256 + TLS 1.3 encryption',
    description:
      'All platform data encrypted at rest with AES-256 and in transit with TLS 1.3',
    badge: 'AES-256',
  },
  {
    icon: Eye,
    title: 'Tamper-evident audit logs',
    description:
      'Immutable, timestamped action logs for every compliance event — ready for regulator review',
    badge: 'Immutable',
  },
  {
    icon: History,
    title: 'Evidence chain of custody',
    description:
      'Every evidence item linked to its owner, workflow, approver, and timestamp',
    badge: 'Traceable',
  },
  {
    icon: Key,
    title: 'SAML 2.0 SSO + MFA enforcement',
    description:
      'Google OAuth on all plans; SAML enterprise SSO for Okta and Azure AD; MFA policy enforcement',
    badge: 'Enterprise',
  },
  {
    icon: BadgeCheck,
    title: 'AU-hosted data residency',
    description:
      'Australian hosting by default, with additional residency requirements reviewed during procurement',
    badge: 'Sovereignty',
  },
];

const AUDIT_LOG_ENTRIES = [
  {
    action: 'Evidence approved',
    control: 'CC6.1 — Logical access controls',
    actor: 'Sarah M.',
    time: '2 min ago',
    status: 'verified',
  },
  {
    action: 'Control drift detected',
    control: 'A1.2 — Availability monitoring',
    actor: 'System',
    time: '14 min ago',
    status: 'alert',
  },
  {
    action: 'Audit packet exported',
    control: 'SOC 2 Type II — Full pack',
    actor: 'James T.',
    time: '1 hr ago',
    status: 'verified',
  },
  {
    action: 'Policy acknowledged',
    control: 'ISO 27001 — A.5.1 Policies',
    actor: 'Rachel K.',
    time: '3 hr ago',
    status: 'verified',
  },
  {
    action: 'Worker credential updated',
    control: 'NDIS — Worker Screening',
    actor: 'Michael D.',
    time: '5 hr ago',
    status: 'verified',
  },
];

const TRUST_STATS = [
  { value: '9', label: 'Framework packs', unit: 'packs' },
  { value: '100%', label: 'Audit event coverage', unit: '' },
  { value: '4', label: 'Access control roles', unit: 'roles' },
  { value: '14', label: 'Day free trial', unit: 'days' },
] as const;

const trustedSectors = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services',
  'Education & research',
  'Government programs',
  'Multi-site operators',
] as const;

export function SecuritySection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      {/* Indigo-tinted dividers for visual distinction */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — copy + feature grid */}
          <ScrollReveal variant="slideUp" range={[0, 0.35]}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-xs sm:text-sm font-medium mb-5">
                <Shield className="w-3.5 h-3.5" />
                Security &amp; Trust
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-white">
                Security built into{' '}
                <span className="text-indigo-300">the platform layer</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mb-8 leading-relaxed">
                Controls are enforced, not just documented. Encryption,
                identity governance, and tamper-evident audit logs are
                infrastructure — not add-ons.
              </p>

              <SectionChoreography
                pattern="depth-reveal"
                stagger={0.04}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {securityFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group flex gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/15 transition-all duration-200"
                    >
                      <div className="shrink-0 inline-flex items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-2 self-start">
                        <Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-white leading-snug">
                            {feature.title}
                          </h3>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-400/80 bg-indigo-500/10 border border-indigo-400/15 rounded px-1.5 py-0.5">
                            {feature.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </SectionChoreography>
            </div>
          </ScrollReveal>

          {/* Right — live audit log visual */}
          <ScrollReveal variant="slideUp" range={[0.05, 0.4]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Live Audit Log
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                  Immutable &middot; Timestamped
                </span>
              </div>

              {/* Log entries */}
              <div className="divide-y divide-white/[0.04]">
                {AUDIT_LOG_ENTRIES.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {entry.status === 'verified' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400/70" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {entry.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.control}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600">
                          {entry.actor}
                        </span>
                        <span className="text-[10px] text-slate-700">
                          &middot;
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {entry.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust stats strip (merged from TrustSection) */}
              <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-4 grid grid-cols-4 gap-3">
                {TRUST_STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-base font-bold text-indigo-400">
                      {stat.value}
                      {stat.unit && (
                        <span className="text-xs text-indigo-400/60 ml-0.5 font-medium">
                          {stat.unit}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Trusted-by sectors (merged from TrustSection) */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.35]} className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 mb-4 text-center">
            Trusted by regulated teams across Australia
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {trustedSectors.map((sector) => (
              <div
                key={sector}
                className="flex items-center justify-center p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
              >
                <span className="text-slate-500 hover:text-slate-300 transition-colors duration-200 text-xs font-medium text-center">
                  {sector}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA links (merged from TrustSection) */}
        <ScrollReveal
          variant="slideUp"
          range={[0.05, 0.35]}
          className="mt-6"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/trust/packet"
              className="mk-btn mk-btn-primary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-indigo-100"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <FileLock2 className="h-4 w-4" />
                Security Review Packet
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/frameworks"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <BadgeCheck className="h-4 w-4" />
                Framework Coverage
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/customer-stories"
              className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <ClipboardCheck className="h-4 w-4" />
                Customer Stories
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
