'use client';

import dynamic from 'next/dynamic';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';
import { ProductHeroSection } from '@/components/marketing/ProductHeroSection';

const ProductShowcaseSection = dynamic(
  () =>
    import('@/components/marketing/ProductShowcaseSection').then(
      (m) => m.ProductShowcaseSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[360px] sm:min-h-[520px] lg:min-h-[600px]" />
    ),
  },
);

const WhatIsFormaOS = dynamic(
  () => import('./components/WhatIsFormaOS').then((m) => m.WhatIsFormaOS),
  { ssr: false, loading: () => null },
);
const ObligationToExecution = dynamic(
  () =>
    import('./components/ObligationToExecution').then(
      (m) => m.ObligationToExecution,
    ),
  { ssr: false, loading: () => null },
);
const ComplianceIntelligence = dynamic(
  () =>
    import('./components/ComplianceIntelligence').then(
      (m) => m.ComplianceIntelligence,
    ),
  { ssr: false, loading: () => null },
);
const WhoIsFor = dynamic(
  () => import('./components/WhoIsFor').then((m) => m.WhoIsFor),
  { ssr: false, loading: () => null },
);
const FinalCTA = dynamic(
  () => import('./components/FinalCTA').then((m) => m.FinalCTA),
  { ssr: false, loading: () => null },
);

export default function ProductPageContent() {
  return (
    <MarketingPageShell>
      <ProductHeroSection />

      <DeferredSection minHeight={620} rootMargin="120px 0px">
        <ProductShowcaseSection />
      </DeferredSection>

      <FrameworkTrustStrip className="mt-4 mb-2" />

      <DeferredSection minHeight={600}>
        <WhatIsFormaOS />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <ObligationToExecution />
      </DeferredSection>

      <DeferredSection minHeight={620}>
        <ComplianceIntelligence />
      </DeferredSection>

      <DeferredSection minHeight={520}>
        <WhoIsFor />
      </DeferredSection>

      <DeferredSection minHeight={440}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
