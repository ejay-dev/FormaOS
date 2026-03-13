'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { DeferredSection } from './shared';
import { HeroSection } from './homepage';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';

// Deferred sections — loaded on scroll
const ValueProposition = dynamic(
  () => import('./homepage/ValueProposition').then((m) => m.ValueProposition),
  { ssr: false, loading: () => null },
);
const ScrollStory = dynamic(
  () => import('./homepage/ScrollStory').then((m) => m.ScrollStory),
  { ssr: false, loading: () => null },
);
const CapabilitiesGrid = dynamic(
  () => import('./homepage/CapabilitiesGrid').then((m) => m.CapabilitiesGrid),
  { ssr: false, loading: () => null },
);
const SecuritySection = dynamic(
  () => import('./homepage/SecuritySection').then((m) => m.SecuritySection),
  { ssr: false, loading: () => null },
);
const TestimonialsSection = dynamic(
  () =>
    import('./homepage/TestimonialsSection').then((m) => m.TestimonialsSection),
  { ssr: false, loading: () => null },
);
const CTASection = dynamic(
  () => import('./homepage/CTASection').then((m) => m.CTASection),
  { ssr: false, loading: () => null },
);

export default function FormaOSHomepage({
  skipHero = false,
}: {
  skipHero?: boolean;
}) {
  return (
    <MotionProvider>
      <div className="figma-homepage mk-page-bg relative min-h-screen overflow-x-hidden">
        <div className="mk-marketing-flow relative z-10">
          {!skipHero && <HeroSection />}

          <FrameworkTrustStrip className="-mt-2 sm:-mt-4 mb-2" />

          <DeferredSection minHeight={480}>
            <ValueProposition />
          </DeferredSection>

          <DeferredSection minHeight={560}>
            <ScrollStory />
          </DeferredSection>

          <DeferredSection minHeight={640}>
            <CapabilitiesGrid />
          </DeferredSection>

          <DeferredSection minHeight={580}>
            <SecuritySection />
          </DeferredSection>

          <DeferredSection minHeight={520}>
            <TestimonialsSection />
          </DeferredSection>

          <DeferredSection minHeight={420}>
            <CTASection />
          </DeferredSection>
        </div>
      </div>
    </MotionProvider>
  );
}
