'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { CircleCheckBig, FileCheck2, HelpCircle, ShieldAlert, Quote, Globe, Lock, ArrowUpRight } from 'lucide-react';

const objectionCards = [
  {
    objection: '"How do we complete security review before procurement sign-off?"',
    response:
      'FormaOS ships with a pre-built security review packet: architecture overview, penetration test summary, vendor assurance questionnaire, and DPA — pre-answering 90% of procurement questions.',
    icon: ShieldAlert,
    proof: 'Security packet included',
  },
  {
    objection: '"Where is our data stored, and do we control residency?"',
    response:
      'AU-based hosting by default. Enterprise plans include data residency controls for AU, US, or EU. Full Data Processing Agreement available for GDPR and Privacy Act 1988 obligations.',
    icon: Globe,
    proof: 'Data sovereignty controls',
  },
  {
    objection: '"How do we know evidence is regulator-defensible?"',
    response:
      'Every evidence item is linked to its creator, workflow step, approver, control, and framework. Immutable audit logs preserve chain of custody — auditors can trace any action back to its origin.',
    icon: FileCheck2,
    proof: 'Immutable audit trail',
  },
  {
    objection: '"Can we get our data out if we leave?"',
    response:
      'Full data portability on exit. Evidence, controls, audit trails, and framework mappings export in portable formats (CSV, ZIP, PDF). Data purged within 30 days of termination per retention policy.',
    icon: ArrowUpRight,
    proof: 'Full data portability',
  },
  {
    objection: '"Will this work across multiple operating sites or entities?"',
    response:
      'Multi-entity and multi-site management is a core capability. Each entity has its own controls, evidence, and audit trail — with centralized oversight from the executive dashboard.',
    icon: CircleCheckBig,
    proof: 'Multi-entity by design',
  },
  {
    objection: '"Is this only for compliance teams, or does it work for operators?"',
    response:
      'Execution is mapped to real operators — not just compliance teams. Task routing, shift tracking, incident workflows, and credential management work for frontline and operational staff.',
    icon: Lock,
    proof: 'Workflow-first design',
  },
] as const;

export function ObjectionHandlingSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
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
            Answer every procurement and security objection — before they slow you down
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            FormaOS ships with the artifacts, controls, and documentation to satisfy security teams, legal, procurement, and regulators — without a multi-week review process.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objectionCards.map((card, idx) => (
            <ScrollReveal
              key={card.objection}
              variant="clipUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="home-panel home-panel--interactive group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-300">
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
