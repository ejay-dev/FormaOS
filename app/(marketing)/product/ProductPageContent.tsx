'use client';

import dynamic from 'next/dynamic';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DepthSection } from '@/components/motion/DepthSection';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';
import { ProductHeroSection } from '@/components/marketing/ProductHeroSection';

/* ── Hero (headline + CTAs) then Showcase (interactive tabs + panel) ── */
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
  {
    ssr: false,
    loading: () => null,
  },
);
const ObligationToExecution = dynamic(
  () =>
    import('./components/ObligationToExecution').then(
      (m) => m.ObligationToExecution,
    ),
  { ssr: false, loading: () => null },
);
const OperatingModel = dynamic(
  () => import('./components/OperatingModel').then((m) => m.OperatingModel),
  {
    ssr: false,
    loading: () => null,
  },
);
const FullControlMapSection = dynamic(
  () =>
    import('./components/FullControlMapSection').then(
      (m) => m.FullControlMapSection,
    ),
  { ssr: false, loading: () => null },
);
const FinalCTA = dynamic(
  () => import('./components/FinalCTA').then((m) => m.FinalCTA),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function ProductPageContent() {
  return (
    <MarketingPageShell className="product-page-flow">
      {/* Hero - headline, gradient text, CTAs */}
      <ProductHeroSection />
      {/* Interactive showcase - tabs left, app panel right */}
      <DeferredSection minHeight={440} rootMargin="120px 0px">
        <ProductShowcaseSection />
      </DeferredSection>

      <FrameworkTrustStrip className="mt-4 mb-2" />

      <DeferredSection minHeight={460}>
        <DepthSection fade>
          <WhatIsFormaOS />
        </DepthSection>
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={440}>
        <DepthSection fade>
          <ObligationToExecution />
        </DepthSection>
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={500}>
        <OperatingModel />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={560}>
        <FullControlMapSection />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={380}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
