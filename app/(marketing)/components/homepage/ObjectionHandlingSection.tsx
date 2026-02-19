'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { CircleCheckBig, FileCheck2, HelpCircle, ShieldAlert, Quote } from 'lucide-react';

const objectionCards = [
  {
    objection: '"How quickly can we complete security review?"',
    response:
      'Use the security review packet and trust workflow to pre-answer architecture and control questions.',
    icon: ShieldAlert,
    proof: 'Security packet included',
  },
  {
    objection: '"How do we know evidence is defensible?"',
    response:
      'FormaOS ties evidence to owners, approvals, timestamps, and workflow context for audit defensibility.',
    icon: FileCheck2,
    proof: 'Immutable audit trail',
  },
  {
    objection: '"Will this work for operations, not only compliance teams?"',
    response:
      'Execution is mapped to real operators and team workflows, not just checklist dashboards.',
    icon: CircleCheckBig,
    proof: 'Workflow-first design',
  },
] as const;

export function ObjectionHandlingSection() {
  return (
    <section className="mk-section relative overflow-hidden">
      {/* Proof section treatment: monochrome, high-contrast, badge-heavy */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.04]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.04]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <HelpCircle className="h-3.5 w-3.5" />
            Buyer Objections
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Answer procurement blockers before they slow the deal
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Objection handling is built into the product narrative so security,
            compliance, and procurement stakeholders can move in sync.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {objectionCards.map((card, idx) => (
            <ScrollReveal
              key={card.objection}
              variant="clipUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-300">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-white/[0.06] mb-4" />

                {/* Objection text: high-contrast white */}
                <p className="text-base font-semibold text-white leading-snug mb-4">
                  {card.objection}
                </p>

                {/* Response */}
                <p className="text-sm leading-relaxed text-slate-400 mb-5">
                  {card.response}
                </p>

                {/* Proof badge: monochrome */}
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-white/40" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5">
                    {card.proof}
                  </span>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
