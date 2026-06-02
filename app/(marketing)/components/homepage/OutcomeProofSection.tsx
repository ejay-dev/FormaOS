'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight } from 'lucide-react';

// Mechanic-grounded scenarios. The "after" column names a real artifact
// (table, cron, statutory timeline) so the section reads like a product
// brief, not a customer-success deck.
const proofScenarios = [
  {
    title: 'Audit preparation',
    impact: 'Auditor bundle on demand',
    before:
      'Evidence scattered across email threads, shared drives, and spreadsheets. Days lost reconstructing trails.',
    after:
      'On-demand ZIP export: framework summary, evidence references with SHA-256 hashes, automation log, score history, chain top anchored to Sigstore Rekor.',
    delta: { from: 'Reconstructed', to: 'Hash-chained', note: 'Verifiable' },
  },
  {
    title: 'Incident response',
    impact: 'SIRS clock automated',
    before:
      'Email threads, ad-hoc severity tagging, statutory timelines tracked by memory.',
    after:
      'org_incidents writes carry severity classification, named owner, and the NDIS SIRS 24h-immediate / 5-business-day-detailed clock encoded in the predicate.',
    delta: { from: 'By memory', to: 'In schema', note: '24h / 5bd' },
  },
  {
    title: 'Compliance posture',
    impact: 'Nightly at 06:00 UTC',
    before:
      'Manual status reconciliation. Board gets a stale quarterly snapshot. Drift surfaces too late.',
    after:
      'Nightly cron at 06:00 UTC iterates orgs in batches, writes to org_control_evaluations; /app/compliance/health renders the live posture with a 4-week sparkline.',
    delta: { from: 'Quarterly', to: 'Nightly', note: 'Cron-driven' },
  },
] as const;

// Numbers below match lib/compliance/evaluators/register.ts and the
// cron schedule in vercel.json. Any reader can count the imports and
// the cron entries and arrive at the same totals.
const outcomeStats = [
  { value: '8', label: 'Framework packs' },
  { value: '252', label: 'Controls mapped' },
  { value: '102', label: 'Auto-evaluated' },
  { value: '150', label: 'Manual attestations' },
  { value: '16', label: 'Production crons' },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-16">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-slate-500">
              What ships, what runs
            </p>
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Operational mechanics, not customer claims
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Every number below comes from the framework registry checked into
              the codebase or the cron schedule running in production. The
              scenarios name the actual table, predicate, or statutory clock
              doing the work — not a generic &ldquo;automated workflow.&rdquo;
            </p>
          </div>
        </ScrollReveal>

        {/* Spec-ledger cards: monochrome hierarchy, numbered, no decorative chrome */}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] lg:grid-cols-3">
          {proofScenarios.map((scenario, idx) => (
            <ScrollReveal
              key={scenario.title}
              variant="fadeLeft"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="group relative flex h-full flex-col bg-[#070b14] p-7 transition-colors duration-300 hover:bg-[#0a0f1a]">
                {/* top accent rail, revealed on hover */}
                <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />

                <header className="mb-6 flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      {scenario.title}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {scenario.impact}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-medium tabular-nums text-white/15">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </header>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-600">
                      Before
                    </span>
                    <p className="mt-1.5 text-slate-500">{scenario.before}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                      After
                    </span>
                    <p className="mt-1.5 text-slate-200">{scenario.after}</p>
                  </div>
                </div>

                {/* State delta — single clean line, no cramped tri-panel */}
                <div className="mt-auto flex items-center gap-2.5 pt-6 font-mono text-xs">
                  <span className="text-slate-600 line-through decoration-slate-700">
                    {scenario.delta.from}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                  <span className="font-medium text-white">
                    {scenario.delta.to}
                  </span>
                  <span className="ml-auto rounded-sm border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                    {scenario.delta.note}
                  </span>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Metrics bar: tabular ledger, hairline-divided, no icon-cards */}
        <ScrollReveal variant="slideUp" range={[0.1, 0.4]}>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
            {outcomeStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 bg-[#070b14] px-6 py-7 transition-colors duration-300 hover:bg-[#0a0f1a]"
              >
                <dt className="order-2 text-xs text-slate-500">{stat.label}</dt>
                <dd className="order-1 font-display text-3xl font-bold tabular-nums text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>

        <div className="mt-10 text-center">
          <Link
            href="/customer-stories"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            See all customer outcomes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
