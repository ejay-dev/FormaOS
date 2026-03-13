'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const AUDIENCES = [
  {
    role: 'CCO / Head of Compliance',
    need: 'Defensible governance infrastructure with control ownership, evidence trails, and posture reporting.',
  },
  {
    role: 'CISO',
    need: 'Security framework alignment — SOC 2, ISO 27001, Essential Eight — with immutable audit logs.',
  },
  {
    role: 'CEO / Executive Leadership',
    need: 'Board-ready compliance narrative, executive dashboards, and accountability that holds under regulator review.',
  },
  {
    role: 'Director of Operations',
    need: 'Cross-site compliance management, workflow automation, and incident tracking at scale.',
  },
  {
    role: 'Risk & Audit Manager',
    need: 'Real-time control visibility, automated gap detection, and drift alerts before auditors arrive.',
  },
  {
    role: 'Healthcare / NDIS / Financial Services',
    need: 'Pre-built framework packs and audit-ready evidence architecture for high-accountability regulated environments.',
  },
] as const;

export function WhoIsFor() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">

        <ScrollReveal variant="fadeUp">
          <div className="mb-12 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-5">
              Who FormaOS is for
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl">
              Built for those who
              <br />
              <span className="text-teal-400">can&apos;t afford to guess.</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AUDIENCES.map((a) => (
            <ScrollReveal key={a.role} variant="fadeUp">
              <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 px-5 py-5 h-full hover:border-white/[0.09] transition-colors duration-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500/60 mb-2">
                  {a.role}
                </p>
                <p className="text-sm leading-[1.65] text-slate-400">
                  {a.need}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
