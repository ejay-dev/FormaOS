'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const procurementFlow = [
  {
    step: '01',
    title: 'Align stakeholders early',
    detail:
      'Bring security, compliance, procurement, and operations into one evaluation flow from day one.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Run security review in parallel',
    detail:
      'Use the security packet and trust center artifacts while teams validate workspace fit in trial.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Close with defensible proof',
    detail:
      'Present ownership trails, evidence chains, and readiness posture for approval without rework.',
    icon: FileCheck2,
  },
] as const;

const artifactBadges = [
  'Security review packet',
  'Framework coverage mapping',
  'Evidence chain posture',
  'Role-based governance model',
  'Audit-ready workflow history',
] as const;

export function ProcurementFlowSection() {
  return (
    <section className="mk-section relative overflow-hidden border-y border-white/10">
      <AmbientParticleLayer intensity="subtle" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.12),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5" />
            Procurement Workflow
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Move from evaluation to procurement without narrative drift
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            FormaOS connects trust artifacts, product workflows, and buyer
            assurance so enterprise deals progress with fewer blockers.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {procurementFlow.map((item, idx) => (
            <ScrollReveal
              key={item.title}
              variant="fadeUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                    Step {item.step}
                  </span>
                  <span className="inline-flex rounded-lg border border-white/15 bg-white/5 p-2">
                    <item.icon className="h-4 w-4 text-slate-200" />
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold text-white">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.detail}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Buyer-Facing Artifacts
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {artifactBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/trust"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Open Trust Center
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
