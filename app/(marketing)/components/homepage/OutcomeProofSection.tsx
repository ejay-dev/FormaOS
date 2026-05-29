'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  TrendingDown,
  GitBranch,
  CalendarCheck,
} from 'lucide-react';

// Mechanic-grounded scenarios. The "after" column names a real artifact
// (table, cron, statutory timeline) so the section reads like a product
// brief, not a customer-success deck.
const proofScenarios = [
  {
    title: 'Audit preparation',
    before:
      'Evidence scattered across email threads, shared drives, and spreadsheets. Days lost reconstructing trails.',
    after:
      'On-demand ZIP export: framework summary, evidence references with SHA-256 hashes, automation log, score history, chain top anchored to Sigstore Rekor.',
    impact: 'Auditor bundle on demand',
    metric: {
      before: 'Reconstructed',
      after: 'Hash-chained',
      improvement: 'Verifiable',
    },
  },
  {
    title: 'Incident response',
    before:
      'Email threads, ad-hoc severity tagging, statutory timelines tracked by memory.',
    after:
      'org_incidents writes carry severity classification, named owner, and the NDIS SIRS 24h-immediate / 5-business-day-detailed clock encoded in the predicate.',
    impact: 'SIRS clock automated',
    metric: {
      before: 'By memory',
      after: 'In schema',
      improvement: '24h / 5bd',
    },
  },
  {
    title: 'Compliance posture',
    before:
      'Manual status reconciliation. Board gets a stale quarterly snapshot. Drift surfaces too late.',
    after:
      'Nightly cron at 06:00 UTC iterates orgs in batches, writes to org_control_evaluations; /app/compliance/health renders the live posture with a 4-week sparkline.',
    impact: '06:00 UTC nightly',
    metric: { before: 'Quarterly', after: 'Nightly', improvement: 'Cron-driven' },
  },
] as const;

// Numbers below match lib/compliance/evaluators/register.ts and the
// cron schedule in vercel.json. Any reader can count the imports and
// the cron entries and arrive at the same totals.
const outcomeStats = [
  { value: '8', label: 'Framework packs', icon: GitBranch },
  { value: '252', label: 'Controls mapped', icon: ShieldCheck },
  { value: '102', label: 'Auto-evaluated', icon: TimerReset },
  { value: '150', label: 'Manual attestations', icon: TrendingUp },
  { value: '16', label: 'Production crons', icon: CalendarCheck },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.3]}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <BarChart3 className="h-3.5 w-3.5 text-slate-300" />
            What ships, what runs
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Operational mechanics, not customer claims
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            Every number below comes from the framework registry checked into
            the codebase or the cron schedule running in production. The
            scenarios name the actual table, predicate, or statutory clock
            doing the work — not a generic &ldquo;automated workflow.&rdquo;
          </p>
        </ScrollReveal>

        {/* Scenario cards: dark panel with illuminated metrics */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {proofScenarios.map((scenario, idx) => (
            <ScrollReveal
              key={scenario.title}
              variant="fadeLeft"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 overflow-hidden transition-colors duration-300 hover:border-white/20">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-5">
                  {scenario.title}
                </h3>

                {/* Before/After comparison — semantic state only */}
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                    <TrendingDown className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
                        Before
                      </span>
                      <p className="text-slate-300 mt-1">{scenario.before}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-300 text-xs uppercase tracking-wider">
                        After
                      </span>
                      <p className="text-slate-200 mt-1">{scenario.after}</p>
                    </div>
                  </div>
                </div>

                {/* Metric panel */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-slate-500">
                      {scenario.metric.before}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Before
                    </div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-xs font-semibold text-slate-300 bg-white/[0.05] border border-white/10 rounded-full px-2 py-0.5">
                      {scenario.metric.improvement}
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-white">
                      {scenario.metric.after}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                      After
                    </div>
                  </div>
                </div>

                {/* Impact badge */}
                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
                  {scenario.impact}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Outcome stats: illuminated row */}
        <div className="mt-8 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {outcomeStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal
                key={stat.label}
                variant="fadeRight"
                range={[idx * 0.04, 0.3 + idx * 0.04]}
              >
                <div className="group relative rounded-xl bg-white/[0.02] border border-white/[0.08] px-5 py-4 text-center overflow-hidden transition-colors duration-300 hover:border-white/20">
                  <Icon className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/customer-stories"
            className="text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            See all customer outcomes{' '}
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
