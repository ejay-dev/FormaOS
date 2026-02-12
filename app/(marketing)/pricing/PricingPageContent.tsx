'use client';

import { VisualDivider } from '@/components/motion';
import {
  PricingHero,
  PricingTiers,
  AllPlansInclude,
  FreeTrial,
  FAQSection,
  FinalCTA,
} from './components';

export default function PricingPageContent() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      <PricingHero />
      <VisualDivider gradient />
      <PricingTiers />
      <VisualDivider />
      <AllPlansInclude />
      <VisualDivider gradient />
      <FreeTrial />
      <VisualDivider />
      <FAQSection />
      <VisualDivider gradient />
      <FinalCTA />
    </div>
  );
}
