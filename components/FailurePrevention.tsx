import { AlertTriangle, CheckCircle2, ShieldOff, ShieldCheck } from 'lucide-react';

const rows = [
  {
    without: 'Manual tracking',
    with: 'Automated enforcement',
  },
  {
    without: 'Missed logs',
    with: 'Required evidence gates',
  },
  {
    without: 'Human error',
    with: 'System checks before work continues',
  },
  {
    without: 'Audit stress',
    with: 'Audit-ready trail generated as work happens',
  },
  {
    without: 'High admin cost',
    with: 'Reduced chasing and rework',
  },
];

const failureModes = [
  'Credentials expire without escalation',
  'Incidents close without required review',
  'Policies change without acknowledgement',
  'Evidence is collected after the audit request',
];

export function FailurePrevention({ className = '' }: { className?: string }) {
  return (
    <section className={`relative overflow-hidden bg-slate-950 py-20 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,0.12),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.14),transparent_34%)]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Failure Prevention
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Stop relying on people to remember compliance
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              FormaOS is positioned as an enforcement system: it prevents
              incomplete workflows, blocks missing evidence paths, and keeps the
              record of what happened.
            </p>
            <div className="mt-8 rounded-3xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-200" aria-hidden="true" />
                <h3 className="font-semibold text-white">Common failure modes</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {failureModes.map((mode) => (
                  <li key={mode} className="flex gap-3 text-sm text-slate-300">
                    <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                    <span>{mode}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.045]">
            <div className="grid grid-cols-2 border-b border-white/[0.08] text-sm font-semibold uppercase tracking-[0.16em]">
              <div className="flex items-center gap-2 bg-red-500/[0.06] px-5 py-4 text-red-100">
                <ShieldOff className="h-4 w-4" aria-hidden="true" />
                Without FormaOS
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/[0.08] px-5 py-4 text-emerald-100">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                With FormaOS
              </div>
            </div>
            {rows.map((row) => (
              <div
                key={row.without}
                className="grid grid-cols-2 border-b border-white/[0.06] last:border-b-0"
              >
                <div className="flex items-center gap-3 px-5 py-5 text-sm text-slate-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                  {row.without}
                </div>
                <div className="flex items-center gap-3 px-5 py-5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  {row.with}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
