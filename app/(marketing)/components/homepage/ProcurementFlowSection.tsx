'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, Building2, FileCheck2, ShieldCheck } from 'lucide-react';

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
  'DPA & data residency docs',
  'Uptime SLA commitments',
] as const;

export function ProcurementFlowSection() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal
          variant="fadeUp"
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mk-badge mk-badge--section mb-5">
            Procurement Workflow
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            From evaluation to procurement without narrative drift
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-400">
            FormaOS connects trust artifacts, product workflows, and buyer
            assurance so enterprise deals progress with fewer blockers.
          </p>
        </ScrollReveal>

        {/* Vertical staggered flow */}
        <div className="mt-10 max-w-2xl mx-auto space-y-3">
          {procurementFlow.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.step} variant="fadeUp">
                <div
                  className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-5"
                  style={{ marginLeft: `${i * 2}rem` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        <span className="text-sm font-semibold text-teal-400 tabular-nums">
                          {item.step}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <h3 className="text-base font-semibold text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal variant="fadeUp" className="mt-6">
          <div className="rounded-xl border border-white/[0.05] bg-slate-900/40 p-5">
            <p className="mk-badge mk-badge--meta mb-3">
              Buyer-Facing Artifacts — available from day one
            </p>
            <div className="flex flex-wrap gap-2">
              {artifactBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/[0.04] bg-slate-900/30 px-3 py-1 text-xs text-slate-500"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/trust"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium"
          >
            Open Trust Center
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/trust/packet"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium"
          >
            Review Security Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
