import { ClipboardList, FileCheck2, GitPullRequestArrow, ShieldCheck, Workflow } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Define compliance workflow',
    body: 'Map the operational process, owners, due dates, evidence, and review points.',
  },
  {
    icon: GitPullRequestArrow,
    title: 'Assign rules',
    body: 'Set what must be present before work can move forward.',
  },
  {
    icon: Workflow,
    title: 'System enforces execution',
    body: 'FormaOS runs checks continuously and blocks incomplete paths.',
  },
  {
    icon: FileCheck2,
    title: 'Evidence generated automatically',
    body: 'Actions, approvals, timestamps, and context become audit evidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit ready anytime',
    body: 'Export the evidence chain instead of rebuilding it under pressure.',
  },
];

export function HowItWorks({ className = '' }: { className?: string }) {
  return (
    <section className={`relative overflow-hidden bg-slate-950 py-24 ${className}`}>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From obligation to enforced evidence chain
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            FormaOS turns compliance into a continuous operating loop rather
            than a document clean-up project before an audit.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.045] p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08]">
                <step.icon className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
