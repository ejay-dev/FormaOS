import { CheckCircle2, FileCheck2, ShieldCheck, Workflow } from 'lucide-react';

const trustPoints = [
  {
    icon: ShieldCheck,
    label: 'Designed for NDIS, AHPRA, ISO, and SOC 2 environments',
  },
  {
    icon: Workflow,
    label: 'Audit-ready workflows',
  },
  {
    icon: FileCheck2,
    label: 'Evidence-backed compliance',
  },
  {
    icon: CheckCircle2,
    label: 'Prevents gaps before they become audit findings',
  },
];

const proofMarks = ['NDIS', 'AHPRA', 'ISO 27001', 'SOC 2'];

export function TrustBar({ className = '' }: { className?: string }) {
  return (
    <section className={`relative border-y border-white/[0.08] bg-slate-950/90 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {proofMarks.map((mark) => (
              <span
                key={mark}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100"
              >
                {mark}
              </span>
            ))}
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:flex lg:items-center">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-2">
                <point.icon className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
