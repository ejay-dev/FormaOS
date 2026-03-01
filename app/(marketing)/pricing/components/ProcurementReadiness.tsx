'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileCheck2, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const assurancePillars = [
  {
    icon: ClipboardCheck,
    title: 'Security review packet',
    detail:
      'Structured packet covering architecture, identity, encryption, data handling, penetration testing, and audit defensibility — ready for your security team.',
  },
  {
    icon: FileCheck2,
    title: 'Procurement artifacts',
    detail:
      'DPA, vendor assurance questionnaire, SLA documentation, and trust-center links to accelerate legal, risk, and procurement sign-off.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational proof',
    detail:
      'Export compliance posture snapshots on demand — evidence packages, control coverage reports, and framework alignment summaries without spreadsheet reconstruction.',
  },
  {
    icon: Lock,
    title: 'Enterprise identity controls',
    detail:
      'SAML 2.0 SSO, MFA enforcement, role-based access by organizational boundary, and session policy management for enterprise identity standards.',
  },
] as const;

export function ProcurementReadiness() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.12),transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]} className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Procurement Assurance
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built to survive security and procurement scrutiny
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Enterprise procurement teams have rigorous requirements. FormaOS ships with the artifacts, controls, and documentation to meet them — before the first question is asked.
          </p>
        </ScrollReveal>

        <SectionChoreography pattern="center-burst" stagger={0.06} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assurancePillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2">
                  <pillar.icon className="h-5 w-5 text-emerald-200" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {pillar.detail}
                </p>
              </article>
          ))}
        </SectionChoreography>

        <ScrollReveal variant="depthSlide" range={[0.1, 0.4]} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
          >
            Talk with Sales Engineering
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
