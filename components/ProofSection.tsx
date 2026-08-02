import Link from 'next/link';
import { ArrowRight, Ban, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import {
  IconFrame,
  SectionEyebrow,
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

/* An example of the sequence FormaOS records, not a recording. The clock
   times this used to carry ("09:12", "09:14") implied a real session in a
   real customer's workspace, which is the kind of detail a reader assumes
   is evidence. The order is what the example is actually demonstrating. */
const auditTrail = [
  { event: 'Worker credential uploaded', result: 'Evidence captured', tone: 'valid' },
  { event: 'Expiry checked against the register', result: 'Passed', tone: 'valid' },
  { event: 'Workflow attempted release', result: 'Blocked, manager review required', tone: 'blocked' },
  { event: 'Manager approved with a reason', result: 'Decision recorded', tone: 'valid' },
  { event: 'Workflow released', result: 'Trail sealed and exportable', tone: 'valid' },
];

export function ProofSection({
  className = '',
  showCta = true,
}: {
  className?: string;
  showCta?: boolean;
}) {
  return (
    <SystemSection className={className}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionEyebrow icon={ShieldCheck}>Proof Layer</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Evidence buyers can inspect before they trust the process
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              FormaOS keeps the audit trail attached to the operational work:
              what changed, who approved it, which evidence was captured, and
              why a workflow was allowed to continue.
            </p>
            <div className={`mt-8 p-6 ${systemPanelClass}`}>
              <div className="flex items-center gap-3">
                <IconFrame icon={ShieldCheck} />
                <div>
                  <p className="text-sm font-medium text-zinc-400">
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
                    <p className="text-sm font-medium text-zinc-400">
                      {metric.label}
                    </p>
                    <div className="mt-4 space-y-2 text-sm leading-5">
                      <p className="text-zinc-400">{metric.before}</p>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                        <span>{metric.after}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-zinc-500">
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
            <SystemFrame label="What the trail records">
              <div className="border-b border-white/[0.07] px-5 py-5">
                <div className="flex items-center gap-3">
                  <IconFrame icon={FileCheck2} className="h-10 w-10 rounded-xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      A credential expiry stopping a release
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Each step below is written to the audit log as the work
                      happens, not reconstructed afterwards.
                    </p>
                  </div>
                </div>
              </div>
              <ol className="divide-y divide-white/[0.06]">
                {auditTrail.map((row) => (
                  <li key={row.event} className="px-5 py-4">
                    <p className="text-sm font-medium text-zinc-200">{row.event}</p>
                    <div className={`mt-1 flex items-center gap-2 text-xs ${
                      row.tone === 'blocked' ? 'text-red-200' : 'text-zinc-400'
                    }`}>
                      {row.tone === 'blocked' ? (
                        <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {row.result}
                    </div>
                  </li>
                ))}
              </ol>
            </SystemFrame>
          </div>
        </div>
    </SystemSection>
  );
}
