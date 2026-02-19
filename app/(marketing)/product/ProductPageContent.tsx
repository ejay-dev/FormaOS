'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { ProductHero } from './components';

/* ── New split hero: full-bleed animation + copy section below ── */
const ProductHeroAnimation = dynamic(
  () => import('@/components/marketing/ProductHeroLargeObject').then((m) => m.ProductHeroAnimation),
  { ssr: false, loading: () => <div className="w-full" style={{ height: '92vh', minHeight: '680px' }} /> },
);
const ProductHeroCopy = dynamic(
  () => import('@/components/marketing/ProductHeroLargeObject').then((m) => m.ProductHeroCopy),
  { ssr: false, loading: () => null },
);

const ENV_FLAG = process.env.NEXT_PUBLIC_PRODUCT_HERO_EXPERIMENT !== '0';

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

function useHero3DEnabled(): boolean {
  const params = useSearchParams();
  const qp = params.get('hero3d');
  if (qp === '1') return true;
  if (qp === '0') return false;
  return ENV_FLAG;
}

export default function ProductPageContent() {
  const hero3d = useHero3DEnabled();

  return (
    <MarketingPageShell enableCinematicField={false}>
      <div dangerouslySetInnerHTML={{ __html: `<!-- hero3d:${hero3d ? 'on' : 'off'} -->` }} />

      {hero3d ? (
        <>
          {/* Full-bleed animation — takes most of first viewport */}
          <ProductHeroAnimation />
          {/* Copy section below the animation */}
          <ProductHeroCopy />
        </>
      ) : (
        <ProductHero />
      )}

      <DeferredSection minHeight={640}>
        <WhatIsFormaOS />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <ObligationToExecution />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={700}>
        <OperatingModel />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <WhatMakesDifferent />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <EnterpriseSecurity />
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <ComplianceIntelligence />
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <BuiltForComplex />
      </DeferredSection>
      <DeferredSection minHeight={620}>
        <WhoIsFor />
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
