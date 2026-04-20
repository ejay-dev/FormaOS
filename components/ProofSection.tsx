import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';

const outcomeMetrics = [
  { label: 'Audit prep', before: '3 weeks', after: '4 hours' },
  { label: 'Evidence chasing', before: 'Manual', after: 'Generated continuously' },
  { label: 'Credential gaps', before: 'Found late', after: 'Blocked before expiry' },
];

const auditTrail = [
  { time: '09:12', event: 'Worker credential uploaded', result: 'Evidence captured' },
  { time: '09:13', event: 'System expiry check', result: 'Passed' },
  { time: '09:14', event: 'Manager review required', result: 'Approval requested' },
  { time: '10:02', event: 'Approval completed', result: 'Audit trail sealed' },
  { time: '10:03', event: 'Workflow released', result: 'Audit-ready' },
];

export function ProofSection({
  className = '',
  showCta = true,
}: {
  className?: string;
  showCta?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden bg-slate-950 py-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(45,212,191,0.15),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(16,185,129,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Proof Layer
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A brutal proof block for buyers who need audit evidence, not vibes
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              This representative NDIS provider scenario shows the exact proof
              FormaOS needs to make visible: before and after, workflow trail,
              evidence preview, and the operational reason pricing is anchored
              to risk.
            </p>
            <div className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.045] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] p-3">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Representative case study
                  </p>
                  <h3 className="text-xl font-semibold text-white">NDIS provider audit-readiness rollout</h3>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {outcomeMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/[0.08] bg-slate-950/50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-red-200">{metric.before}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span className="text-emerald-200">{metric.after}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Replace this scenario with client-approved metrics as soon as a
                named case study is cleared. It is intentionally structured like
                a real buyer proof pack without fabricating a testimonial.
              </p>
            </div>
            {showCta ? (
              <Link
                href="/case-studies"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                View case study structure
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div className="grid gap-4">
            <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-6">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                <h3 className="font-semibold text-white">Metrics panel</h3>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-white">3w</p>
                  <p className="text-sm text-slate-400">manual prep before</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">4h</p>
                  <p className="text-sm text-slate-400">audit pack target</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">0</p>
                  <p className="text-sm text-slate-400">known unresolved gaps</p>
                </div>
              </div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  <h3 className="font-semibold text-white">Evidence preview</h3>
                </div>
                <span className="rounded-full bg-emerald-300/[0.09] px-3 py-1 text-xs font-semibold text-emerald-100">
                  Export ready
                </span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {auditTrail.map((row) => (
                  <div key={`${row.time}-${row.event}`} className="grid grid-cols-[3.5rem_1fr] gap-4 px-5 py-4">
                    <span className="font-mono text-xs text-slate-500">{row.time}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{row.event}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {row.result}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
