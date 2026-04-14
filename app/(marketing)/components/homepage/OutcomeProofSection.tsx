'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { RadarPulse } from '@/components/marketing/SectionBackgrounds';
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

// TimerReset, ShieldCheck used in outcomeStats; TrendingUp/Down used in scenarios

const proofScenarios = [
  {
    title: 'Audit preparation',
    before:
      'Evidence scattered across email threads, shared drives, and spreadsheets. Teams scramble for days before each audit.',
    after:
      'Framework-mapped evidence bundles exported in minutes. Every control linked to its owner, workflow, and proof.',
    impact: '87% faster audit prep',
    metric: { before: '2+ weeks', after: '< 3 hours', improvement: '87%' },
  },
  {
    title: 'Incident response',
    before:
      'Ownership unclear. Escalation inconsistent. Regulator asks for an evidence trail — nothing complete exists.',
    after:
      'Structured triage with named owners, timestamped actions, and a complete trail from detection to resolution.',
    impact: '24hr incident-to-report',
    metric: { before: '5–7 days', after: '< 24 hrs', improvement: '80%' },
  },
  {
    title: 'Compliance visibility',
    before:
      'Manual status reconciliation. Board gets a stale quarterly snapshot. Gaps discovered too late.',
    after:
      'Live compliance score with framework coverage, control drift alerts, and board-ready posture view updated continuously.',
    impact: 'Real-time board confidence',
    metric: { before: 'Quarterly', after: 'Real-time', improvement: '100%' },
  },
] as const;

const outcomeStats = [
  { value: '87%', label: 'Faster audit preparation', icon: TimerReset },
  {
    value: '100%',
    label: 'Controls with named owners',
    icon: ShieldCheck,
  },
  {
    value: '9',
    label: 'Frameworks supported out of the box',
    icon: GitBranch,
  },
  {
    value: '< 3hrs',
    label: 'Average evidence pack export time',
    icon: TrendingUp,
  },
  {
    value: '24/7',
    label: 'Continuous compliance monitoring',
    icon: CalendarCheck,
  },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      <RadarPulse />
      {/* Data section treatment: dark inset panel */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060a14] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.3]}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-teal-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Outcome Proof
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Measurable outcomes, not just features
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            Compliance teams using FormaOS reduce audit prep from weeks to
            hours, close incident reports in under 24 hours, and give their
            boards real-time posture visibility instead of stale quarterly
            snapshots.
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
              <article className="home-panel home-panel--interactive group relative rounded-2xl bg-[#080c18] border border-white/[0.06] p-6 overflow-hidden">
                {/* Top illumination line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />

                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-5">
                  {scenario.title}
                </h3>

                {/* Before/After comparison */}
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/[0.06] border border-rose-500/10">
                    <TrendingDown className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-rose-300 text-xs uppercase tracking-wider">
                        Before
                      </span>
                      <p className="text-slate-300 mt-1">{scenario.before}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-300 text-xs uppercase tracking-wider">
                        After
                      </span>
                      <p className="text-slate-200 mt-1">{scenario.after}</p>
                    </div>
                  </div>
                </div>

                {/* Illuminated metric panel */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-rose-400/80">
                      {scenario.metric.before}
                    </div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Before
                    </div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5">
                      {scenario.metric.improvement}
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-emerald-400">
                      {scenario.metric.after}
                    </div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider">
                      After
                    </div>
                  </div>
                </div>

                {/* Impact badge */}
                <div className="mt-4 inline-flex rounded-full border border-amber-400/20 bg-amber-500/[0.06] px-3 py-1 text-xs font-semibold text-amber-300">
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
                <div className="home-panel home-panel--soft group relative rounded-xl bg-[#080c18] border border-white/[0.06] px-5 py-4 text-center overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 group-hover:via-teal-400/20 to-transparent transition-all duration-500" />
                  <Icon className="w-5 h-5 text-teal-400/60 mx-auto mb-2" />
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
            className="text-sm font-semibold text-teal-400 underline-offset-4 hover:underline"
          >
            See all customer outcomes{' '}
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
