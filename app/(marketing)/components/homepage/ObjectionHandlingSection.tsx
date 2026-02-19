'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { CircleCheckBig, FileCheck2, HelpCircle, ShieldAlert } from 'lucide-react';

const objectionCards = [
  {
    objection: '“How quickly can we complete security review?”',
    response:
      'Use the security review packet and trust workflow to pre-answer architecture and control questions.',
    icon: ShieldAlert,
  },
  {
    objection: '“How do we know evidence is defensible?”',
    response:
      'FormaOS ties evidence to owners, approvals, timestamps, and workflow context for audit defensibility.',
    icon: FileCheck2,
  },
  {
    objection: '“Will this work for operations, not only compliance teams?”',
    response:
      'Execution is mapped to real operators and team workflows, not just checklist dashboards.',
    icon: CircleCheckBig,
  },
] as const;

export function ObjectionHandlingSection() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.14),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
            <HelpCircle className="h-3.5 w-3.5" />
            Buyer Objections
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Answer procurement blockers before they slow the deal
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Objection handling is built into the product narrative so security,
            compliance, and procurement stakeholders can move in sync.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {objectionCards.map((card, idx) => (
            <ScrollReveal
              key={card.objection}
              variant="fadeUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="inline-flex rounded-lg border border-blue-400/30 bg-blue-500/10 p-2">
                  <card.icon className="h-5 w-5 text-blue-200" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">
                  {card.objection}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {card.response}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
