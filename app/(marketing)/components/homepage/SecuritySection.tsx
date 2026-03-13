'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
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

const SECURITY_FEATURES = [
  {
    icon: Shield,
    title: 'SOC 2 Type II-aligned controls',
    desc: 'Common Criteria, Availability, and Confidentiality categories',
    tag: 'SOC 2',
  },
  {
    icon: Lock,
    title: 'AES-256 + TLS 1.3',
    desc: 'Encrypted at rest and in transit — no exceptions',
    tag: 'Encryption',
  },
  {
    icon: Eye,
    title: 'Tamper-evident audit logs',
    desc: 'Immutable, timestamped event logs ready for regulator review',
    tag: 'Immutable',
  },
  {
    icon: History,
    title: 'Evidence chain of custody',
    desc: 'Every artifact linked to owner, workflow, approver, and timestamp',
    tag: 'Traceable',
  },
  {
    icon: Key,
    title: 'SAML 2.0 SSO + MFA enforcement',
    desc: 'Google OAuth on all plans; Okta and Azure AD for enterprise',
    tag: 'Enterprise SSO',
  },
  {
    icon: BadgeCheck,
    title: 'Data residency controls',
    desc: 'AU-hosted by default; US and EU residency on enterprise plans',
    tag: 'Sovereignty',
  },
] as const;

const AUDIT_LOG = [
  { action: 'Evidence approved', control: 'CC6.1 – Logical access controls', actor: 'Sarah M.', time: '2m', ok: true },
  { action: 'Control drift detected', control: 'A1.2 – Availability monitoring', actor: 'System', time: '14m', ok: false },
  { action: 'Audit packet exported', control: 'SOC 2 Type II – Full pack', actor: 'James T.', time: '1h', ok: true },
  { action: 'Policy acknowledged', control: 'ISO 27001 – A.5.1 Policies', actor: 'Rachel K.', time: '3h', ok: true },
  { action: 'Worker credential updated', control: 'NDIS – Worker Screening', actor: 'Michael D.', time: '5h', ok: true },
] as const;

export function SecuritySection() {
  return (
    <section className="mk-section home-section relative">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Left — copy + features */}
          <ScrollReveal variant="fadeUp">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-5">
              Enterprise security
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white mb-4">
              Security built into
              <br />
              <span className="text-slate-400">the operating layer.</span>
            </h2>
            <p className="text-sm leading-[1.75] text-slate-400 mb-8 max-w-sm">
              Controls are enforced, not just recorded. Encryption, identity
              governance, immutable audit logs, and data residency are
              infrastructure — not add-ons.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECURITY_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40 hover:border-white/[0.09] transition-colors duration-200"
                  >
                    <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 border border-white/[0.06]">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white leading-snug mb-0.5">
                        {f.title}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Right — live audit log panel */}
          <ScrollReveal variant="fadeUp">
            <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Audit Log — Live
                  </span>
                </div>
                <span className="text-[10px] text-slate-700 uppercase tracking-wider">
                  Immutable · Timestamped
                </span>
              </div>

              {/* Log entries */}
              <div className="divide-y divide-white/[0.04]">
                {AUDIT_LOG.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 shrink-0">
                      {entry.ok ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white leading-snug">
                        {entry.action}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {entry.control}
                      </p>
                      <p className="text-[10px] text-slate-700 mt-1">
                        {entry.actor} · {entry.time} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats strip */}
              <div className="border-t border-white/[0.05] px-4 py-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Audit events logged', value: '100%' },
                  { label: 'Evidence with chain-of-custody', value: '100%' },
                  { label: 'Data encrypted at rest', value: 'AES-256' },
                  { label: 'Avg audit packet export', value: '< 2 min' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-sm font-semibold text-teal-400">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      {stat.label}
                    </p>
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
