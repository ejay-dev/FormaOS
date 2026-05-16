import {
  ArrowRightLeft,
  ClipboardCheck,
  Settings2,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { TrustBar } from '@/components/TrustBar';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import {
  AllPlansInclude,
  FAQSection,
  FinalCTA,
  PricingComparisonTable,
  PricingHero,
  PricingTiers,
  ProcurementReadiness,
} from './components';

/**
 * Inline pricing sections (CostOfNonCompliance + HowPricingWorks). Both
 * previously freelanced their own styling (corner brackets, animate-ping
 * dots, mono-eyebrow + fake terminal codes); they now route through the
 * shared SystemSection / SectionEyebrow / IconFrame / systemPanelClass
 * primitives that the home page already uses, so the marketing site reads
 * as one coherent product.
 */
function CostOfNonCompliance() {
  return (
    <SystemSection variant="amber">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={ArrowRightLeft} tone="warning">
          Manual vs enforced
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          One failed audit costs more than{' '}
          <AccentText>a year of FormaOS.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Pricing only makes sense when measured against the manual work it
          replaces — evidence chasing, repeated reviews, escalation gaps, and
          late remediation.
        </p>
      </div>

      <div className={`overflow-hidden ${systemPanelClass}`}>
        {/* Column headers — plain, no neon pulse dots */}
        <div className="grid grid-cols-1 border-b border-white/[0.06] md:grid-cols-2">
          <div className="flex items-center gap-3 px-6 py-4">
            <StatusPill tone="blocked">Manual / pre-FormaOS</StatusPill>
          </div>
          <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4 md:border-t-0 md:border-l">
            <StatusPill tone="valid">System enforced</StatusPill>
          </div>
        </div>

        {/* Rows */}
        <ul>
          {MANUAL_COMPLIANCE_COST_ANCHORS.map((item, idx) => (
            <li
              key={item.label}
              className={`grid grid-cols-1 ${idx > 0 ? 'border-t border-white/[0.05]' : ''} md:grid-cols-2`}
            >
              <div className="flex items-start gap-4 px-6 py-5">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-rose-100/90">
                    {item.manual}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-white/[0.04] px-6 py-5 md:border-t-0 md:border-l">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Enforced
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-emerald-100/95">
                    {item.formaos}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SystemSection>
  );
}

const pricingSteps = [
  {
    icon: ClipboardCheck,
    title: 'Assess scope',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope.',
  },
  {
    icon: Settings2,
    title: 'Configure enforcement',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails.',
  },
  {
    icon: ShieldCheck,
    title: 'Operate continuously',
    body: 'FormaOS stays always on in the background and generates evidence as work happens.',
  },
] as const;

function HowPricingWorks() {
  return (
    <SystemSection variant="cyan">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Workflow} tone="live">
          How pricing works
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Priced by compliance scope,{' '}
          <AccentText>not feature unlocks.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Your plan is shaped by frameworks, sites, evidence volume, workflow
          complexity, and the level of support required to keep the system
          operating well.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pricingSteps.map((step, index) => (
          <article
            key={step.title}
            className={`flex flex-col p-6 ${systemPanelClass}`}
          >
            <div className="flex items-center justify-between">
              <IconFrame icon={step.icon} tone="live" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {step.body}
            </p>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-5 text-center text-sm leading-relaxed text-slate-300">
        Pricing scales with your compliance scope and operating complexity —{' '}
        <span className="font-semibold text-white">
          not arbitrary feature gates.
        </span>
      </div>
    </SystemSection>
  );
}

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white pricing-page-flow">
      <PricingHero />

      <TrustBar />

      {/*
        Stable anchor target for the hero's "View pricing" link. The
        <section> inside PricingTiers is rendered client-only via
        DeferredSection's IntersectionObserver, so the id is missing
        from the initial SSR HTML and the in-page anchor click had
        nothing to scroll to until the section was already on-screen.
        This div-with-id sits in the static HTML and matches the same
        anchor name so the browser can scroll the user to the deferred
        section, which then mounts via the observer.
      */}
      <div id="pricing-table" className="scroll-mt-24" />
      <DeferredSection minHeight={600}>
        <PricingTiers />
      </DeferredSection>

      <DeferredSection minHeight={520}>
        <AllPlansInclude />
      </DeferredSection>

      <DeferredSection minHeight={500}>
        <PricingComparisonTable />
      </DeferredSection>

      <DeferredSection minHeight={440}>
        <CostOfNonCompliance />
      </DeferredSection>

      <DeferredSection minHeight={400}>
        <HowPricingWorks />
      </DeferredSection>

      <DeferredSection minHeight={460}>
        <ProcurementReadiness />
      </DeferredSection>

      <DeferredSection minHeight={460}>
        <FAQSection />
      </DeferredSection>

      <DeferredSection minHeight={380}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
