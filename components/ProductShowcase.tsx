import { Activity, ClipboardCheck, FileCheck2, LayoutDashboard } from 'lucide-react';

const showcaseTabs = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    status: '88% posture',
    lines: ['4 controls blocked', '17 evidence items verified', '2 overdue owners escalated'],
  },
  {
    icon: ClipboardCheck,
    title: 'Workflow builder',
    status: 'Credential renewal gate',
    lines: ['Police check required', 'Manager approval required', 'Auto-escalate 14 days before expiry'],
  },
  {
    icon: FileCheck2,
    title: 'Audit logs',
    status: 'Immutable trail',
    lines: ['Actor captured', 'Before/after state stored', 'Export bundle ready'],
  },
  {
    icon: Activity,
    title: 'Status panel',
    status: 'Live risk view',
    lines: ['Incidents: controlled', 'Policies: review due', 'Evidence: complete'],
  },
];

export function ProductShowcase({ className = '' }: { className?: string }) {
  return (
    <section className={`relative overflow-hidden bg-slate-950 py-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.14),transparent_36%)]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Product Visibility
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Real operating screens, not abstract promise art
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Serious buyers need to see the system working: dashboard, workflow
              builder, audit logs, and status panels that show proof and
              enforcement in one place.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/[0.08] bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/40">
              <div className="rounded-[1.5rem] border border-white/[0.08] bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    FormaOS live workspace
                  </p>
                  <p className="mt-1 font-semibold text-white">NDIS readiness command center</p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1 text-xs font-semibold text-emerald-100">
                  Enforcing
                </span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {showcaseTabs.map((tab) => (
                  <article
                    key={tab.title}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] p-2">
                          <tab.icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                        </div>
                        <h3 className="font-semibold text-white">{tab.title}</h3>
                      </div>
                      <span className="text-xs font-medium text-emerald-200">{tab.status}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {tab.lines.map((line) => (
                        <li key={line} className="flex items-center gap-2 text-sm text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
