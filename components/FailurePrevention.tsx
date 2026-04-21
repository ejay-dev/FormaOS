import { AlertTriangle, CheckCircle2, ShieldOff, ShieldCheck } from 'lucide-react';
import {
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemFrame,
  SystemSection,
  systemPanelClass,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

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
    <SystemSection variant="red" className={className}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionEyebrow icon={ShieldOff} tone="blocked">Failure Prevention</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Stop relying on memory for work that needs proof
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              FormaOS turns recurring compliance obligations into required
              workflow steps, so missing reviews, expired credentials, and
              incomplete evidence are caught before they become audit issues.
            </p>
            <div className={`mt-8 p-5 ${systemPanelClass}`}>
              <div className="flex items-center gap-3">
                <IconFrame icon={AlertTriangle} tone="warning" />
                <h3 className="font-semibold text-white">Common failure modes</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {failureModes.map((mode) => (
                  <li key={mode} className={`flex gap-3 p-3 text-sm text-slate-300 ${systemPanelCompactClass}`}>
                    <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                    <span>{mode}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SystemFrame label="ENFORCEMENT CONSOLE" status="POLICY ACTIVE">
            <div className="border-b border-red-300/15 bg-red-500/[0.06] px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <StatusPill tone="blocked" pulse>Blocked state</StatusPill>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Shift closure blocked until incident review is attached
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    The system keeps the exception visible and records the
                    resolution path once the required review is complete.
                  </p>
                </div>
                <div className="rounded-2xl border border-red-300/25 bg-red-500/[0.08] px-4 py-3 text-right shadow-[0_0_34px_rgba(248,113,113,0.16)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-100">Gate result</p>
                  <p className="mt-1 text-2xl font-bold text-red-100">Blocked</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-cyan-300/[0.1] text-sm font-semibold uppercase tracking-[0.16em]">
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
                className="grid grid-cols-2 border-b border-cyan-300/[0.08] last:border-b-0"
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
          </SystemFrame>
        </div>
    </SystemSection>
  );
}
