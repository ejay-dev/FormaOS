'use client';

import { CheckCircle2, ClipboardCheck, Settings2, ShieldCheck } from 'lucide-react';
import { FailurePrevention } from '@/components/FailurePrevention';
import { HowItWorks } from '@/components/HowItWorks';
import { ProductShowcase } from '@/components/ProductShowcase';
import { ProofSection } from '@/components/ProofSection';
import { ROIMetrics } from '@/components/ROIMetrics';
import { TrustBar } from '@/components/TrustBar';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemFrame,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { FinalCTA, FAQSection, PricingHero, PricingTiers } from './components';

const pricingSteps = [
  {
    icon: ClipboardCheck,
    title: 'We assess your compliance requirements',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope.',
  },
  {
    icon: Settings2,
    title: 'We configure enforced workflows',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails.',
  },
  {
    icon: ShieldCheck,
    title: 'Your system runs continuously',
    body: 'FormaOS stays always on in the background and generates evidence as work happens.',
  },
];

function CostOfNonCompliance() {
  return (
    <SystemSection variant="amber">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionEyebrow icon={ShieldCheck} tone="warning">Cost Context</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              One failed audit can cost more than <AccentText>a year of FormaOS</AccentText>
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              The page must justify price before asking for commitment. That
              means showing the manual compliance cost, not burying buyers in a
              feature comparison table.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <StatusPill tone="warning">Manual risk</StatusPill>
              <StatusPill tone="valid">System enforced</StatusPill>
            </div>
          </div>
          <SystemFrame label="COST MODEL" status="RISK ANCHOR">
            <div className="grid grid-cols-[1fr_1fr] border-b border-cyan-300/[0.1] text-sm font-semibold uppercase tracking-[0.16em]">
              <div className="px-5 py-4 text-red-100">Without FormaOS</div>
              <div className="px-5 py-4 text-emerald-100">With FormaOS</div>
            </div>
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
              <div key={item.label} className="grid grid-cols-[1fr_1fr] border-b border-cyan-300/[0.08] last:border-b-0">
                <div className="px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{item.manual}</p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    System enforced
                  </p>
                  <p className="mt-2 text-sm text-emerald-100">{item.formaos}</p>
                </div>
              </div>
            ))}
          </SystemFrame>
        </div>
    </SystemSection>
  );
}

function HowPricingWorks() {
  return (
    <SystemSection variant="cyan">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow icon={Settings2}>How Pricing Works</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Priced by <AccentText>compliance scope</AccentText>, not feature unlocks
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            The commercial logic matches the infrastructure promise: more risk,
            more complexity, and more enforcement scope create the price.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pricingSteps.map((step, index) => (
            <article
              key={step.title}
              className={`p-6 ${systemPanelClass}`}
            >
              <IconFrame icon={step.icon} tone={index === 2 ? 'valid' : 'live'} />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
        <div className={`mx-auto mt-10 flex max-w-3xl items-start gap-3 p-5 text-sm leading-6 text-slate-300 ${systemPanelClass}`}>
          <IconFrame icon={CheckCircle2} tone="valid" className="mt-0.5 h-10 w-10 shrink-0" />
          Pricing scales based on your compliance scope and organisational
          complexity - not arbitrary feature gates.
        </div>
    </SystemSection>
  );
}

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white">
      <PricingHero />
      <TrustBar />
      <ROIMetrics
        eyebrow="Manual Cost Anchor"
        title="Make the current cost visible before the price table"
      />
      <PricingTiers />
      <CostOfNonCompliance />
      <ProofSection />
      <ProductShowcase />
      <FailurePrevention />
      <HowPricingWorks />
      <HowItWorks />
      <FAQSection />
      <FinalCTA />
    </MarketingPageShell>
  );
}
