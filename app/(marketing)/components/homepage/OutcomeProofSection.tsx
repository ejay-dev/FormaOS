'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  ArrowRight,
  ShieldCheck,
  TimerReset,
  GitBranch,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';

const proofScenarios = [
  {
    title: 'Audit request lifecycle',
    before:
      'Evidence hunted across email threads, shared drives, and spreadsheets — days before auditor arrives.',
    after:
      'Framework-mapped evidence bundles exported in under 2 minutes. Every control linked to its proof.',
    metric: { before: 'Days', after: '< 2 hrs', improvement: '~90%' },
  },
  {
    title: 'Incident response workflow',
    before:
      'Ownership unclear. Escalation inconsistent. Regulator asks for evidence trail — nothing exists.',
    after:
      'Routed triage with named owners, timestamped actions, and full audit trail from detection to resolution.',
    metric: { before: 'Ad-hoc', after: 'Structured', improvement: 'Traceable' },
  },
  {
    title: 'Compliance posture reporting',
    before:
      'Manual status reconciliation. Board gets a stale snapshot. Gaps discovered late.',
    after:
      'Live compliance score with framework coverage, control drift alerts, and board-ready posture view.',
    metric: { before: 'Weekly', after: 'Real-time', improvement: 'Live' },
  },
] as const;

const outcomeStats = [
  { value: '< 2 min', label: 'Audit packet export time', icon: TimerReset },
  {
    value: 'Continuous',
    label: 'Compliance posture monitoring',
    icon: ShieldCheck,
  },
  {
    value: 'Named owner',
    label: 'On every control and evidence item',
    icon: TrendingUp,
  },
  {
    value: '7 frameworks',
    label: 'Pre-built, audit-ready out of the box',
    icon: GitBranch,
  },
  {
    value: '< 7 days',
    label: 'Typical security review cycle',
    icon: CalendarCheck,
  },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal
          variant="fadeUp"
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mk-badge mk-badge--section mb-5">Outcome Proof</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Real outcomes. Before and after FormaOS.
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-400">
            Regulated teams don't need more features — they need fewer
            compliance crises. FormaOS connects governance to measurable
            operational outcomes.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {proofScenarios.map((scenario) => (
            <ScrollReveal key={scenario.title} variant="fadeUp">
              <article className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-5 h-full">
                <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500 mb-4">
                  {scenario.title}
                </h3>

                <div className="space-y-3 text-sm mb-4">
                  <div className="p-3 rounded-lg bg-rose-500/[0.06] border border-rose-500/10">
                    <span className="font-medium text-rose-400 text-xs uppercase tracking-wider">
                      Before
                    </span>
                    <p className="text-slate-400 mt-1">{scenario.before}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                    <span className="font-medium text-emerald-400 text-xs uppercase tracking-wider">
                      After
                    </span>
                    <p className="text-slate-300 mt-1">{scenario.after}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-slate-800/30">
                  <div className="text-center flex-1">
                    <div className="text-base font-semibold text-rose-400/80">
                      {scenario.metric.before}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Before
                    </div>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-xs font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5">
                      {scenario.metric.improvement}
                    </span>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-base font-semibold text-emerald-400">
                      {scenario.metric.after}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                      After
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {outcomeStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={stat.label} variant="fadeUp">
                <div className="rounded-lg border border-white/[0.06] bg-slate-900/50 px-4 py-3 text-center">
                  <Icon className="w-4 h-4 text-teal-400/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/customer-stories"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium"
          >
            Review Customer Outcomes
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium"
          >
            Security Review Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
