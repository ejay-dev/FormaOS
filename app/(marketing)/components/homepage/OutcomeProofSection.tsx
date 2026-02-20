'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, BarChart3, ShieldCheck, TimerReset, TrendingUp, TrendingDown } from 'lucide-react';

const proofScenarios = [
  {
    title: 'Audit request lifecycle',
    before: 'Evidence hunt across documents and inbox threads.',
    after: 'Mapped control evidence with export-ready audit bundles.',
    impact: 'Faster audit response',
    metric: { before: 'Days', after: 'Hours', improvement: '~80%' },
  },
  {
    title: 'Incident response workflow',
    before: 'Ownership gaps and inconsistent escalation trails.',
    after: 'Routed triage with accountable owners and timestamped actions.',
    impact: 'Lower remediation latency',
    metric: { before: 'Ad-hoc', after: 'Structured', improvement: 'Traceable' },
  },
  {
    title: 'Executive reporting flow',
    before: 'Manual status reconciliation for board and leadership updates.',
    after: 'Single posture view tied to live execution and evidence health.',
    impact: 'Higher decision confidence',
    metric: { before: 'Weekly', after: 'Real-time', improvement: 'Live' },
  },
] as const;

const outcomeStats = [
  { value: 'Execution-first', label: 'Control ownership model', icon: TrendingUp },
  { value: 'Defensible', label: 'Evidence chain posture', icon: ShieldCheck },
  { value: 'Buyer-ready', label: 'Trust workflow path', icon: BarChart3 },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section relative overflow-hidden">
      {/* Data section treatment: dark inset panel */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060a14] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-teal-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Outcome Proof
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Show the before and after, not just feature lists
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            FormaOS connects workflows to measurable operational outcomes so
            buyers and operators can validate maturity with real execution
            signals.
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
              <article className="group relative rounded-2xl bg-[#080c18] border border-white/[0.06] p-6 overflow-hidden">
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
                      <span className="font-semibold text-rose-300 text-xs uppercase tracking-wider">Before</span>
                      <p className="text-slate-300 mt-1">{scenario.before}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-300 text-xs uppercase tracking-wider">After</span>
                      <p className="text-slate-200 mt-1">{scenario.after}</p>
                    </div>
                  </div>
                </div>

                {/* Illuminated metric panel */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-rose-400/80">{scenario.metric.before}</div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider">Before</div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5">
                      {scenario.metric.improvement}
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-emerald-400">{scenario.metric.after}</div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider">After</div>
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
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {outcomeStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal
                key={stat.label}
                variant="fadeRight"
                range={[idx * 0.04, 0.3 + idx * 0.04]}
              >
                <div className="group relative rounded-xl bg-[#080c18] border border-white/[0.06] px-5 py-4 text-center overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 group-hover:via-teal-400/20 to-transparent transition-all duration-500" />
                  <Icon className="w-5 h-5 text-teal-400/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/customer-stories"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Review Customer Outcomes
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Security Review Packet
          </Link>
          <Link
            href="/compare"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            <TimerReset className="h-4 w-4" />
            Compare Platforms
          </Link>
        </div>
      </div>
    </section>
  );
}
