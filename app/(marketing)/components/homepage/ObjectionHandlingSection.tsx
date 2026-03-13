'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  CircleCheckBig,
  FileCheck2,
  Globe,
  Lock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ObjectionCard {
  objection: string;
  response: string;
  icon: LucideIcon;
  proof: string;
}

const objectionCards: ObjectionCard[] = [
  {
    objection:
      '"How do we complete security review before procurement sign-off?"',
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
      'Every evidence item is linked to its creator, workflow step, approver, control, and framework. Immutable audit logs preserve chain of custody.',
    icon: FileCheck2,
    proof: 'Immutable audit trail',
  },
  {
    objection: '"Can we get our data out if we leave?"',
    response:
      'Full data portability on exit. Evidence, controls, audit trails, and framework mappings export in portable formats (CSV, ZIP, PDF). Data purged within 30 days of termination.',
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
    objection:
      '"Is this only for compliance teams, or does it work for operators?"',
    response:
      'Execution is mapped to real operators — not just compliance teams. Task routing, shift tracking, incident workflows, and credential management work for frontline staff.',
    icon: Lock,
    proof: 'Workflow-first design',
  },
];

export function ObjectionHandlingSection() {
  const [primary, ...remaining] = objectionCards;
  const PrimaryIcon = primary.icon;

  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal
          variant="fadeUp"
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mk-badge mk-badge--section mb-5">
            Buyer Objections
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Answer every procurement and security objection — before they slow
            you down
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-400">
            FormaOS ships with the artifacts, controls, and documentation to
            satisfy security teams, legal, procurement, and regulators.
          </p>
        </ScrollReveal>

        {/* Tier 1 — Primary objection */}
        <ScrollReveal variant="fadeUp" className="mt-10 mb-3">
          <article className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-6 md:p-8">
            <div className="md:flex md:gap-8 md:items-start">
              <div className="flex-1">
                <p className="text-base md:text-lg font-semibold text-white leading-snug mb-3">
                  {primary.objection}
                </p>
                <p className="text-sm leading-relaxed text-slate-400">
                  {primary.response}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-2 shrink-0">
                <PrimaryIcon className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-teal-400/80">
                  {primary.proof}
                </span>
              </div>
            </div>
          </article>
        </ScrollReveal>

        {/* Tier 2 — Remaining objections */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((card) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.objection} variant="fadeUp">
                <article className="rounded-xl border border-white/[0.05] bg-slate-900/40 p-5 h-full">
                  <p className="text-sm font-semibold text-white leading-snug mb-3">
                    {card.objection}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400 mb-4">
                    {card.response}
                  </p>
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      {card.proof}
                    </span>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
