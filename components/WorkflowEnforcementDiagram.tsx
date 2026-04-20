import { AlertTriangle, Ban, CheckCircle2, FileClock, GitBranch, LockKeyhole, UserCheck } from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

const flowSteps = [
  {
    icon: UserCheck,
    title: 'User action',
    body: 'A worker submits evidence, completes a task, or changes a compliance record.',
  },
  {
    icon: LockKeyhole,
    title: 'System check',
    body: 'FormaOS checks required fields, ownership, due date, approvals, and policy rules.',
  },
  {
    icon: GitBranch,
    title: 'Allowed or blocked',
    body: 'Compliant work continues. Incomplete work is stopped before it becomes an audit gap.',
  },
  {
    icon: FileClock,
    title: 'Logged',
    body: 'The decision, actor, timestamp, and evidence context are written into the audit trail.',
  },
  {
    icon: CheckCircle2,
    title: 'Audit ready',
    body: 'Evidence is exportable with the workflow trail that explains why it can be trusted.',
  },
];

export function WorkflowEnforcementDiagram({ className = '' }: { className?: string }) {
  return (
    <SystemSection variant="cyan" className={className}>
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow icon={LockKeyhole}>Workflow Enforcement</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            User action - system check - <AccentText>allowed or blocked</AccentText> - logged - audit ready
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            This is the shift from compliance software to compliance
            infrastructure. FormaOS runs in the background and enforces rules at
            execution level.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className={`flex items-center justify-between gap-3 p-4 ${systemPanelCompactClass}`}>
            <span className="text-sm font-semibold text-slate-200">Credential verified</span>
            <StatusPill tone="valid">Valid</StatusPill>
          </div>
          <div className={`flex items-center justify-between gap-3 p-4 ${systemPanelCompactClass}`}>
            <span className="text-sm font-semibold text-slate-200">Review due in 3 days</span>
            <StatusPill tone="warning">Warning</StatusPill>
          </div>
          <div className={`flex items-center justify-between gap-3 p-4 ${systemPanelCompactClass}`}>
            <span className="text-sm font-semibold text-slate-200">Missing evidence</span>
            <StatusPill tone="blocked" pulse>Blocked</StatusPill>
          </div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {flowSteps.map((step, index) => (
            <article
              key={step.title}
              className={`relative p-5 ${systemPanelClass}`}
            >
              {index < flowSteps.length - 1 ? (
                <div className="absolute right-[-1.25rem] top-1/2 hidden h-px w-6 bg-cyan-300/35 lg:block" />
              ) : null}
              <IconFrame icon={step.icon} tone={step.title === 'Allowed or blocked' ? 'warning' : 'live'} />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
        <div className={`mx-auto mt-6 max-w-3xl border-red-300/25 bg-red-500/[0.08] p-5 shadow-[0_0_36px_rgba(248,113,113,0.14)] ${systemPanelCompactClass}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <IconFrame icon={Ban} tone="blocked" />
              <div>
                <p className="text-sm font-semibold text-red-100">Action blocked - missing compliance step</p>
                <p className="mt-1 text-sm text-slate-400">
                  Required supervisor sign-off must be completed before evidence is marked audit-ready.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-amber-100">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Enforced before failure
            </div>
          </div>
        </div>
    </SystemSection>
  );
}
