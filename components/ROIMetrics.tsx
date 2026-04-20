import { BarChart3, Clock3, DollarSign, ShieldAlert } from 'lucide-react';

const roiMetrics = [
  {
    icon: Clock3,
    value: '2-6 weeks',
    label: 'manual audit-prep exposure',
    detail: 'Use this as the baseline FormaOS is designed to compress.',
  },
  {
    icon: BarChart3,
    value: '80-200+',
    label: 'staff hours at risk',
    detail: 'Evidence chasing, review cycles, and late remediation effort.',
  },
  {
    icon: DollarSign,
    value: '$15k-$50k+',
    label: 'typical annual admin burden',
    detail: 'A planning anchor for audit preparation labour and rework.',
  },
  {
    icon: ShieldAlert,
    value: 'Always on',
    label: 'workflow enforcement',
    detail: 'Controls run in the background instead of relying on memory.',
  },
];

export function ROIMetrics({
  eyebrow = 'ROI Anchor',
  title = 'Price FormaOS against the cost of manual compliance',
  className = '',
}: {
  eyebrow?: string;
  title?: string;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden bg-slate-950 py-20 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.16),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Enterprise buyers do not buy features. They buy lower audit risk,
            lower manual overhead, and fewer compliance gaps. These anchors
            make the cost of inaction visible before the plan table appears.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roiMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.045] p-6 shadow-2xl shadow-slate-950/30"
            >
              <div className="inline-flex rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-3">
                <metric.icon className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                {metric.value}
              </p>
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">
                {metric.label}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {metric.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
