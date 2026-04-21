import { Activity, Ban, ClipboardCheck, FileCheck2, LayoutDashboard } from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemFrame,
  SystemSection,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

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
    lines: ['Incidents: controlled', 'Policies: warning', 'Evidence gap: blocked'],
  },
];

export function ProductShowcase({ className = '' }: { className?: string }) {
  return (
    <SystemSection variant="cyan" className={className}>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionEyebrow icon={LayoutDashboard}>Product Visibility</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Real operating screens, not <AccentText>abstract promise art</AccentText>
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Serious buyers need to see the system working: dashboard, workflow
              builder, audit logs, and status panels that show proof and
              enforcement in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <StatusPill tone="live">Live system</StatusPill>
              <StatusPill tone="valid">Enforcing</StatusPill>
              <StatusPill tone="neutral">Immutable log</StatusPill>
            </div>
          </div>
          <SystemFrame label="LIVE SYSTEM" status="ENFORCING">
              <div className="flex items-center justify-between border-b border-cyan-300/[0.1] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    FormaOS live workspace
                  </p>
                  <p className="mt-1 font-semibold text-white">NDIS readiness command center</p>
                </div>
                <StatusPill tone="valid">Enforcing</StatusPill>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {showcaseTabs.map((tab) => (
                  <article
                    key={tab.title}
                    className={`p-4 ${systemPanelCompactClass}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <IconFrame icon={tab.icon} className="h-9 w-9 rounded-xl" />
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
                <article className="sm:col-span-2 rounded-2xl border border-red-300/20 bg-red-500/[0.075] p-4 shadow-[0_0_34px_rgba(248,113,113,0.12)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <IconFrame icon={Ban} tone="blocked" className="h-9 w-9 rounded-xl" />
                      <div>
                        <p className="text-sm font-semibold text-red-100">
                          Action blocked - approval missing
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          The task cannot be marked audit-ready until the required reviewer signs off.
                        </p>
                      </div>
                    </div>
                    <StatusPill tone="blocked" pulse>
                      Blocked
                    </StatusPill>
                  </div>
                </article>
              </div>
          </SystemFrame>
        </div>
    </SystemSection>
  );
}
