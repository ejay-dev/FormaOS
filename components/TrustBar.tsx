import { CheckCircle2, FileCheck2, ShieldCheck, Workflow } from 'lucide-react';
import {
  IconFrame,
  StatusPill,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

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
    <section className={`relative isolate overflow-hidden border-y border-cyan-300/[0.12] bg-slate-950/95 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(2,8,23,0.8),rgba(6,21,37,0.72))]" />
      <div className="mk-security-grid pointer-events-none absolute inset-0 opacity-[0.16]" />
      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div className={`${systemPanelCompactClass} flex flex-col gap-5 px-5 py-4 lg:flex-row lg:items-center lg:justify-between`}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="live">Frameworks supported</StatusPill>
            {proofMarks.map((mark) => (
              <span
                key={mark}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_18px_rgba(45,212,191,0.08)]"
              >
                {mark}
              </span>
            ))}
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:flex lg:items-center">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-2">
                <IconFrame icon={point.icon} tone="valid" className="h-8 w-8 rounded-xl" />
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
