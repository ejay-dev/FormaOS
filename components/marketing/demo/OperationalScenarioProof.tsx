'use client';

import { ShieldCheck, Siren, LineChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const SCENARIOS = [
  {
    title: 'Audit request lifecycle',
    icon: ShieldCheck,
    before: 'Evidence spread across folders and inbox threads.',
    after: 'Control-linked evidence bundle generated in one flow.',
    metric: 'Prep time reduced by up to 80%',
  },
  {
    title: 'Incident response workflow',
    icon: Siren,
    before: 'Manual escalation chains and delayed accountability.',
    after: 'Structured response tasks with real-time ownership tracking.',
    metric: 'Mean response coordination improved by 2.3x',
  },
  {
    title: 'Executive readiness reporting',
    icon: LineChart,
    before: 'Status updates assembled manually before board meetings.',
    after: 'Live posture rollups across frameworks and business units.',
    metric: 'Weekly reporting overhead cut by 60%',
  },
];

export function OperationalScenarioProof() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-teal-300">
            Operational Proof
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Real workflows. Measurable compliance outcomes.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-400 sm:text-base">
            FormaOS demonstrates value through executable scenarios that map
            directly to audit, incident, and executive readiness workflows.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <article
                key={scenario.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-lg border border-teal-400/20 bg-teal-500/10 p-2.5">
                    <Icon className="h-5 w-5 text-teal-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {scenario.title}
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-rose-100/90">
                    <strong className="text-rose-200">Before:</strong>{' '}
                    {scenario.before}
                  </p>
                  <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-emerald-100/90">
                    <strong className="text-emerald-200">After:</strong>{' '}
                    {scenario.after}
                  </p>
                </div>
                <div className="mt-4 inline-flex rounded-full border border-teal-300/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                  {scenario.metric}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`${appBase}/auth/signup?source=operational_scenarios`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Launch Guided Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            See Live Enterprise Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
