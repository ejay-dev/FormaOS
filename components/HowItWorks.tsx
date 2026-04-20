import { ClipboardList, FileCheck2, GitPullRequestArrow, ShieldCheck, Workflow } from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

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
    <SystemSection variant="emerald" className={className}>
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow icon={Workflow} tone="valid">How It Works</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From obligation to <AccentText>enforced evidence chain</AccentText>
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
              className={`p-5 ${systemPanelClass}`}
            >
              <div className="flex items-center justify-between gap-3">
                <IconFrame icon={step.icon} tone={index >= 2 ? 'valid' : 'live'} />
                {index === 2 ? <StatusPill tone="valid">Enforcing</StatusPill> : null}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
    </SystemSection>
  );
}
