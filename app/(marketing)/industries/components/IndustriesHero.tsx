'use client';

import { Building2 } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { IndustriesHeroVisual } from './IndustriesHeroVisual';
import { compliancePlanHref, demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

const PILLS = [
  { color: 'bg-slate-400', label: 'NDIS & Aged Care' },
  { color: 'bg-slate-400', label: 'Mental Health Services' },
  { color: 'bg-slate-400', label: 'Healthcare & Allied Health' },
  { color: 'bg-slate-400', label: 'Financial Services' },
  { color: 'bg-slate-400', label: 'Education & Childcare' },
  { color: 'bg-slate-400', label: 'Construction & Infrastructure' },
];

export function IndustriesHero() {
  return (
    <ImmersiveHero
      theme="industries"
      visualContent={<IndustriesHeroVisual />}
      badge={{
        icon: <Building2 className="w-4 h-4 text-slate-300" />,
        text: 'Industry Solutions',
        colorClass: 'slate',
      }}
      headline={
        <>
          One OS. Multiple
          <br />
          <span className="text-foreground">
            Regulatory Frameworks.
          </span>
        </>
      }
      subheadline="FormaOS adapts to your regulatory requirements: NDIS, AHPRA, NSQHS, ASIC, AUSTRAC, WHS, NQF. Pre-built frameworks. System-enforced controls."
      extras={<IndustriesExtras />}
      primaryCta={{
        href: compliancePlanHref('industries_hero'),
        label: PUBLIC_CTA_LABELS.compliancePlan,
      }}
      secondaryCta={{ href: demoHref('industries_hero'), label: PUBLIC_CTA_LABELS.seeDemo }}
    />
  );
}

function IndustriesExtras() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-sm text-slate-500 mb-3">
        Six regulated industries covered, from the NDIS Commission to ASIC and
        AHPRA
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
        {PILLS.map((pill) => (
          <span
            key={pill.label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pill.color}`} />
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default IndustriesHero;
