'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, BarChart3, ShieldCheck, TimerReset } from 'lucide-react';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const proofScenarios = [
  {
    title: 'Audit request lifecycle',
    before: 'Evidence hunt across documents and inbox threads.',
    after: 'Mapped control evidence with export-ready audit bundles.',
    impact: 'Faster audit response',
  },
  {
    title: 'Incident response workflow',
    before: 'Ownership gaps and inconsistent escalation trails.',
    after: 'Routed triage with accountable owners and timestamped actions.',
    impact: 'Lower remediation latency',
  },
  {
    title: 'Executive reporting flow',
    before: 'Manual status reconciliation for board and leadership updates.',
    after: 'Single posture view tied to live execution and evidence health.',
    impact: 'Higher decision confidence',
  },
] as const;

const outcomeStats = [
  { value: 'Execution-first', label: 'Control ownership model' },
  { value: 'Defensible', label: 'Evidence chain posture' },
  { value: 'Buyer-ready', label: 'Trust workflow path' },
] as const;

export function OutcomeProofSection() {
  return (
    <section className="mk-section relative overflow-hidden border-y border-white/10">
      <AmbientParticleLayer intensity="subtle" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.10),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
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

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {proofScenarios.map((scenario, idx) => (
            <ScrollReveal
              key={scenario.title}
              variant="fadeLeft"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
                  {scenario.title}
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-slate-200">
                    <span className="font-semibold text-rose-200">Before:</span>{' '}
                    {scenario.before}
                  </p>
                  <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-slate-100">
                    <span className="font-semibold text-emerald-200">After:</span>{' '}
                    {scenario.after}
                  </p>
                </div>
                <div className="mt-4 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                  {scenario.impact}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {outcomeStats.map((stat, idx) => (
            <ScrollReveal
              key={stat.label}
              variant="fadeRight"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
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
