'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { PricingHero } from './components';

const PricingTiers = dynamic(() => import('./components/PricingTiers').then((m) => m.PricingTiers), {
  ssr: false,
  loading: () => null,
});
const AllPlansInclude = dynamic(
  () => import('./components/AllPlansInclude').then((m) => m.AllPlansInclude),
  { ssr: false, loading: () => null },
);
const ProcurementReadiness = dynamic(
  () => import('./components/ProcurementReadiness').then((m) => m.ProcurementReadiness),
  { ssr: false, loading: () => null },
);
const FreeTrial = dynamic(() => import('./components/FreeTrial').then((m) => m.FreeTrial), {
  ssr: false,
  loading: () => null,
});
const FAQSection = dynamic(() => import('./components/FAQSection').then((m) => m.FAQSection), {
  ssr: false,
  loading: () => null,
});
const FinalCTA = dynamic(() => import('./components/FinalCTA').then((m) => m.FinalCTA), {
  ssr: false,
  loading: () => null,
});

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white" enableCinematicField={false}>
      <PricingHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={920}>
        <PricingTiers />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <AllPlansInclude />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={620}>
        <ProcurementReadiness />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <FreeTrial />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={760}>
        <FAQSection />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={460}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
