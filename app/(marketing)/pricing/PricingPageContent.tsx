'use client';

import { CheckCircle2, ClipboardCheck, Settings2, ShieldCheck } from 'lucide-react';
import { FailurePrevention } from '@/components/FailurePrevention';
import { HowItWorks } from '@/components/HowItWorks';
import { ProductShowcase } from '@/components/ProductShowcase';
import { ProofSection } from '@/components/ProofSection';
import { ROIMetrics } from '@/components/ROIMetrics';
import { TrustBar } from '@/components/TrustBar';
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
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Cost Context
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One failed audit can cost more than a year of FormaOS
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              The page must justify price before asking for commitment. That
              means showing the manual compliance cost, not burying buyers in a
              feature comparison table.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.045]">
            <div className="grid grid-cols-[1fr_1fr] border-b border-white/[0.08] text-sm font-semibold uppercase tracking-[0.16em]">
              <div className="px-5 py-4 text-red-100">Without FormaOS</div>
              <div className="px-5 py-4 text-emerald-100">With FormaOS</div>
            </div>
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
              <div key={item.label} className="grid grid-cols-[1fr_1fr] border-b border-white/[0.06] last:border-b-0">
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
          </div>
        </div>
      </div>
    </section>
  );
}

function HowPricingWorks() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            How Pricing Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Priced by compliance scope, not feature unlocks
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
              className="rounded-3xl border border-white/[0.08] bg-white/[0.045] p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                <step.icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5 text-sm leading-6 text-slate-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" aria-hidden="true" />
          Pricing scales based on your compliance scope and organisational
          complexity - not arbitrary feature gates.
        </div>
      </div>
    </section>
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
