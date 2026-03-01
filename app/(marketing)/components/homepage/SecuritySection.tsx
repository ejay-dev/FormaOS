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
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

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

const AUDIT_LOG_ENTRIES = [
  {
    action: 'Evidence approved',
    control: 'CC6.1 – Logical access controls',
    actor: 'Sarah M.',
    time: '2 min ago',
    status: 'verified',
  },
  {
    action: 'Control drift detected',
    control: 'A1.2 – Availability monitoring',
    actor: 'System',
    time: '14 min ago',
    status: 'alert',
  },
  {
    action: 'Audit packet exported',
    control: 'SOC 2 Type II – Full pack',
    actor: 'James T.',
    time: '1 hr ago',
    status: 'verified',
  },
  {
    action: 'Policy acknowledged',
    control: 'ISO 27001 – A.5.1 Policies',
    actor: 'Rachel K.',
    time: '3 hr ago',
    status: 'verified',
  },
  {
    action: 'Worker credential updated',
    control: 'NDIS – Worker Screening',
    actor: 'Michael D.',
    time: '5 hr ago',
    status: 'verified',
  },
];

const SECURITY_STATS = [
  { label: 'Audit events logged', value: '100%' },
  { label: 'Evidence with chain-of-custody', value: '100%' },
  { label: 'Data encrypted at rest', value: 'AES-256' },
  { label: 'Average audit packet export', value: '< 2 min' },
] as const;

export function SecuritySection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — copy + feature grid */}
          <ScrollReveal variant="slideUp" range={[0, 0.35]}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-xs sm:text-sm font-medium mb-5">
                <BadgeCheck className="w-3.5 h-3.5" />
                Enterprise Security
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
                Security built into
                <span className="text-slate-400"> the operating layer</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mb-3 leading-relaxed">
                Controls are enforced, not just recorded. Security is embedded at the operating layer — where compliance evidence is generated automatically and audit trails are always complete.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed">
                FormaOS ships with enterprise security controls as infrastructure: encryption, identity governance, immutable audit logs, and data residency — ready for your procurement team before the first question is asked.
              </p>

              <SectionChoreography pattern="depth-reveal" stagger={0.04} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {securityFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group flex gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-teal-400/15 transition-all duration-200"
                    >
                      <div className="shrink-0 inline-flex items-center justify-center rounded-lg border border-teal-400/20 bg-teal-500/10 p-2 self-start">
                        <Icon className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-white leading-snug">
                            {feature.title}
                          </h3>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-teal-400/80 bg-teal-500/10 border border-teal-400/15 rounded px-1.5 py-0.5">
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
                  Immutable · Timestamped
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
                      <p className="text-sm font-medium text-white">{entry.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{entry.control}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600">{entry.actor}</span>
                        <span className="text-[10px] text-slate-700">·</span>
                        <span className="text-[10px] text-slate-600">{entry.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats strip */}
              <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-4 grid grid-cols-2 gap-3">
                {SECURITY_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-base font-bold text-teal-400">{stat.value}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
