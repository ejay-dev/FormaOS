'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

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
    <section className="mk-section home-section home-section--process relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            Procurement Workflow
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            From evaluation to procurement without narrative drift
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            FormaOS connects trust artifacts, product workflows, and buyer
            assurance so enterprise deals progress with fewer blockers.
          </p>
        </ScrollReveal>

        {/* 3-step horizontal timeline */}
        <SectionChoreography
          pattern="stagger-wave"
          stagger={0.12}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {procurementFlow.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                {/* Connector arrow between steps (hidden on mobile) */}
                {idx < procurementFlow.length - 1 && (
                  <div className="absolute top-10 left-[calc(100%_-_8px)] z-20 hidden md:flex items-center">
                    <ArrowRight className="w-5 h-5 text-teal-400/30" />
                  </div>
                )}

                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-teal-400/20 hover:bg-white/[0.04] transition-all duration-300 h-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-2.5">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400/60">
                      Step {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-400">
                    {item.detail}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </SectionChoreography>

        {/* Buyer-facing artifacts panel */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.35]} className="mt-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Buyer-Facing Artifacts — available from day one
            </p>
            <div className="flex flex-wrap gap-2">
              {artifactBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-teal-400/20 bg-teal-500/[0.06] px-3 py-1 text-xs text-teal-300"
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
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Open Trust Center
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/trust/packet"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
