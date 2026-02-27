'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DepthSection } from '@/components/motion/DepthSection';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';

/* ── Hero (headline + CTAs) then Showcase (interactive tabs + panel) ── */
const ProductHero = dynamic(
  () => import('@/components/marketing/ProductHeroShowcase').then((m) => m.ProductHero),
  { ssr: false, loading: () => <div className="w-full" style={{ minHeight: '100vh' }} /> },
);
const ProductShowcase = dynamic(
  () => import('@/components/marketing/ProductHeroShowcase').then((m) => m.ProductShowcase),
  { ssr: false, loading: () => <div className="w-full" style={{ minHeight: '600px' }} /> },
);

const OperationalScenarioProof = dynamic(
  () => import('@/components/marketing/demo/OperationalScenarioProof').then((m) => m.OperationalScenarioProof),
  { ssr: false, loading: () => null },
);
const WhatIsFormaOS = dynamic(() => import('./components/WhatIsFormaOS').then((m) => m.WhatIsFormaOS), {
  ssr: false,
  loading: () => null,
});
const ObligationToExecution = dynamic(
  () => import('./components/ObligationToExecution').then((m) => m.ObligationToExecution),
  { ssr: false, loading: () => null },
);
const OperatingModel = dynamic(() => import('./components/OperatingModel').then((m) => m.OperatingModel), {
  ssr: false,
  loading: () => null,
});
const WhatMakesDifferent = dynamic(
  () => import('./components/WhatMakesDifferent').then((m) => m.WhatMakesDifferent),
  { ssr: false, loading: () => null },
);
const EnterpriseSecurity = dynamic(
  () => import('./components/EnterpriseSecurity').then((m) => m.EnterpriseSecurity),
  { ssr: false, loading: () => null },
);
const ComplianceIntelligence = dynamic(
  () => import('./components/ComplianceIntelligence').then((m) => m.ComplianceIntelligence),
  { ssr: false, loading: () => null },
);
const BuiltForComplex = dynamic(
  () => import('./components/BuiltForComplex').then((m) => m.BuiltForComplex),
  { ssr: false, loading: () => null },
);
const WhoIsFor = dynamic(() => import('./components/WhoIsFor').then((m) => m.WhoIsFor), {
  ssr: false,
  loading: () => null,
});
const TheOutcome = dynamic(() => import('./components/TheOutcome').then((m) => m.TheOutcome), {
  ssr: false,
  loading: () => null,
});
const FinalCTA = dynamic(() => import('./components/FinalCTA').then((m) => m.FinalCTA), {
  ssr: false,
  loading: () => null,
});

export default function ProductPageContent() {
  return (
    <MarketingPageShell>
      <ProductHero />
      <ProductShowcase />

      <FrameworkTrustStrip className="mt-4 mb-2" />

      <DeferredSection minHeight={640}>
        <DepthSection fade>
          <WhatIsFormaOS />
        </DepthSection>
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <ObligationToExecution />
        </DepthSection>
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={700}>
        <OperatingModel />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <WhatMakesDifferent />
        </DepthSection>
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <EnterpriseSecurity />
        </DepthSection>
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <ComplianceIntelligence />
        </DepthSection>
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <BuiltForComplex />
        </DepthSection>
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <DepthSection fade>
          <WhoIsFor />
        </DepthSection>
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={680}>
        <OperationalScenarioProof />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <TheOutcome />
      </DeferredSection>
      <DeferredSection minHeight={520}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
