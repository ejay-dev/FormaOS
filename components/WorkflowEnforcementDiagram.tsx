import { CheckCircle2, FileClock, GitBranch, LockKeyhole, UserCheck } from 'lucide-react';

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
    <section className={`relative overflow-hidden bg-slate-950 py-20 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(45,212,191,0.08)_1px,transparent_1px),linear-gradient(rgba(45,212,191,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Workflow Enforcement
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            User action - system check - allowed or blocked - logged - audit ready
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            This is the shift from compliance software to compliance
            infrastructure. FormaOS runs in the background and enforces rules at
            execution level.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {flowSteps.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-3xl border border-white/[0.08] bg-white/[0.045] p-5"
            >
              {index < flowSteps.length - 1 ? (
                <div className="absolute right-[-1.25rem] top-1/2 hidden h-px w-6 bg-cyan-300/35 lg:block" />
              ) : null}
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                <step.icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
