import { BarChart3, Clock3, DollarSign, ShieldAlert } from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

const roiMetrics = [
  {
    icon: Clock3,
    value: '2-6 weeks',
    label: 'manual audit-prep exposure',
    detail: 'Use this as the baseline FormaOS is designed to compress.',
  },
  {
    icon: BarChart3,
    value: '80-200+',
    label: 'staff hours at risk',
    detail: 'Evidence chasing, review cycles, and late remediation effort.',
  },
  {
    icon: DollarSign,
    value: '$15k-$50k+',
    label: 'typical annual admin burden',
    detail: 'A planning anchor for audit preparation labour and rework.',
  },
  {
    icon: ShieldAlert,
    value: 'Always on',
    label: 'workflow enforcement',
    detail: 'Controls run in the background instead of relying on memory.',
  },
];

export function ROIMetrics({
  eyebrow = 'ROI Anchor',
  title = 'Price FormaOS against the cost of manual compliance',
  className = '',
}: {
  eyebrow?: string;
  title?: string;
  className?: string;
}) {
  return (
    <SystemSection variant="emerald" className={className}>
        <div className="max-w-3xl">
          <SectionEyebrow icon={BarChart3} tone="valid">{eyebrow}</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <AccentText>{title}</AccentText>
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Enterprise buyers do not buy features. They buy lower audit risk,
            lower manual overhead, and fewer compliance gaps. These anchors
            make the cost of inaction visible before the plan table appears.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roiMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`p-6 ${systemPanelClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <IconFrame icon={metric.icon} tone="valid" />
                <StatusPill tone={metric.value === 'Always on' ? 'live' : 'warning'}>
                  {metric.value === 'Always on' ? 'Live' : 'Risk'}
                </StatusPill>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                {metric.value}
              </p>
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">
                {metric.label}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {metric.detail}
              </p>
            </article>
          ))}
        </div>
    </SystemSection>
  );
}
