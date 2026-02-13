'use client';

import { VisualDivider } from '@/components/motion';
import {
  PricingHero,
  PricingTiers,
  AllPlansInclude,
  ProcurementReadiness,
  FreeTrial,
  FAQSection,
  FinalCTA,
} from './components';

export default function PricingPageContent() {
  return (
    <div className="min-h-screen text-white overflow-hidden">
      <PricingHero />
      <VisualDivider gradient />
      <PricingTiers />
      <VisualDivider />
      <AllPlansInclude />
      <VisualDivider gradient />
      <ProcurementReadiness />
      <VisualDivider />
      <FreeTrial />
      <VisualDivider />
      <FAQSection />
      <VisualDivider gradient />
      <FinalCTA />
    </div>
  );
}
