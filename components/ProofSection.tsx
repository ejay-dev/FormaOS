import Link from 'next/link';
import { ArrowRight, Ban, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import {
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemFrame,
  SystemSection,
  systemPanelClass,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

const outcomeMetrics = [
  { label: 'Audit prep', before: 'Weeks of chasing', after: 'Pack ready in hours' },
  { label: 'Evidence capture', before: 'Manual follow-up', after: 'Logged as work happens' },
  { label: 'Credential gaps', before: 'Found late', after: 'Blocked before release' },
];

const auditTrail = [
  { time: '09:12', event: 'Worker credential uploaded', result: 'Evidence captured', tone: 'valid' },
  { time: '09:13', event: 'System expiry check', result: 'Passed', tone: 'valid' },
  { time: '09:14', event: 'Workflow attempted release', result: 'Blocked - manager review required', tone: 'blocked' },
  { time: '10:02', event: 'Approval completed', result: 'Audit trail sealed', tone: 'valid' },
  { time: '10:03', event: 'Workflow released', result: 'Audit-ready', tone: 'valid' },
];

export function ProofSection({
  className = '',
  showCta = true,
}: {
  className?: string;
  showCta?: boolean;
}) {
  return (
    <SystemSection variant="cyan" className={className}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionEyebrow icon={ShieldCheck}>Proof Layer</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Evidence buyers can inspect before they trust the process
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              FormaOS keeps the audit trail attached to the operational work:
              what changed, who approved it, which evidence was captured, and
              why a workflow was allowed to continue.
            </p>
            <div className={`mt-8 p-6 ${systemPanelClass}`}>
              <div className="flex items-center gap-3">
                <IconFrame icon={ShieldCheck} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Representative proof pack
                  </p>
                  <h3 className="text-xl font-semibold text-white">
                    NDIS credential readiness workflow
                  </h3>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {outcomeMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className={`p-4 ${systemPanelCompactClass}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>
                    <div className="mt-4 space-y-2 text-sm leading-5">
                      <p className="text-slate-400">{metric.before}</p>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <ArrowRight className="h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
                        <span>{metric.after}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Representative scenario only. Named customer outcomes are
                published after client approval, with the same structure:
                baseline, workflow trail, evidence, and outcome.
              </p>
            </div>
            {showCta ? (
              <Link
                href="/case-studies"
                className="mk-btn mk-btn-secondary mt-8 min-h-[48px] px-5 py-3 text-sm font-semibold"
              >
                View proof packs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div>
            <SystemFrame label="EVIDENCE PACK" status="REVIEW READY">
              <div className="border-b border-white/[0.07] px-5 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <IconFrame icon={Clock3} tone="valid" className="h-10 w-10 rounded-xl" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Readiness snapshot
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">
                        Audit pack generated from live workflow history
                      </h3>
                    </div>
                  </div>
                  <StatusPill tone="valid">Ready</StatusPill>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className={systemPanelCompactClass + ' p-4'}>
                    <p className="text-2xl font-semibold text-white">3w</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">manual prep avoided</p>
                  </div>
                  <div className={systemPanelCompactClass + ' p-4'}>
                    <p className="text-2xl font-semibold text-white">4h</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">target pack assembly</p>
                  </div>
                  <div className={systemPanelCompactClass + ' p-4'}>
                    <p className="text-2xl font-semibold text-white">0</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">open release blockers</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  <h3 className="font-semibold text-white">Workflow trail</h3>
                </div>
                <StatusPill tone="valid">Sealed</StatusPill>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {auditTrail.map((row) => (
                  <div key={`${row.time}-${row.event}`} className="grid grid-cols-[3.5rem_1fr] gap-4 px-5 py-4">
                    <span className="font-mono text-xs text-slate-500">{row.time}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{row.event}</p>
                      <div className={`mt-1 flex items-center gap-2 text-xs ${
                        row.tone === 'blocked' ? 'text-red-200' : 'text-emerald-200'
                      }`}>
                        {row.tone === 'blocked' ? (
                          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {row.result}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SystemFrame>
          </div>
        </div>
    </SystemSection>
  );
}
