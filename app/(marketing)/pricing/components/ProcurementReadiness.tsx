'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileCheck2, ShieldCheck, Lock } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { StampPattern } from '@/components/marketing/SectionBackgrounds';

const assurancePillars = [
  {
    icon: ClipboardCheck,
    title: 'Security review packet',
    detail:
      'Structured packet covering architecture, identity, encryption, data handling, and audit defensibility for buyer review.',
  },
  {
    icon: FileCheck2,
    title: 'Procurement artifacts',
    detail:
      'DPA, vendor assurance materials, enterprise service terms, and trust-center links for legal, risk, and procurement review.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational proof',
    detail:
      'Export compliance posture snapshots on demand - evidence packages, control coverage reports, and framework alignment summaries without spreadsheet reconstruction.',
  },
  {
    icon: Lock,
    title: 'Enterprise identity controls',
    detail:
      'SAML SSO, MFA controls, role-based access by organizational boundary, and session policy management reviewed during enterprise evaluation.',
  },
] as const;

export function ProcurementReadiness() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[#181a1c] via-[#202325] to-[#181a1c]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(161,161,170,0.1),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_80%,rgba(161,161,170,0.1),transparent_40%)]" />
      <StampPattern />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]} className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold text-zinc-500">
            Procurement Assurance
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built to survive security and procurement scrutiny
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-300">
            Enterprise buyers need a clear review path. FormaOS surfaces the materials, controls, and operating context early so security and procurement teams can evaluate with less back-and-forth.
          </p>
        </ScrollReveal>

        <SectionChoreography pattern="center-burst" stagger={0.06} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assurancePillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
                <div className="inline-flex rounded-lg border border-white/15 bg-white/[0.06] p-2">
                  <pillar.icon className="h-5 w-5 text-zinc-300" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {pillar.detail}
                </p>
              </article>
          ))}
        </SectionChoreography>

        <ScrollReveal variant="depthSlide" range={[0.1, 0.4]} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90"
          >
            Review Security Packet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact?type=procurement&source=pricing_procurement"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
          >
            Talk with Sales Engineering
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
