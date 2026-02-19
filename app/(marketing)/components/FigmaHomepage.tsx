'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { DeferredSection } from './shared';
import { HeroSection, ValueProposition } from './homepage';

// Lazy-load heavy rendering components
const ScrollStory = dynamic(() => import('./homepage/ScrollStory').then((m) => m.ScrollStory), {
  ssr: false,
  loading: () => null,
});
const ComplianceEngineDemo = dynamic(
  () => import('./homepage/ComplianceEngineDemo').then((m) => m.ComplianceEngineDemo),
  { ssr: false, loading: () => null },
);
const CapabilitiesGrid = dynamic(
  () => import('./homepage/CapabilitiesGrid').then((m) => m.CapabilitiesGrid),
  { ssr: false, loading: () => null },
);
const Industries = dynamic(() => import('./homepage/Industries').then((m) => m.Industries), {
  ssr: false,
  loading: () => null,
});
const SecuritySection = dynamic(
  () => import('./homepage/SecuritySection').then((m) => m.SecuritySection),
  { ssr: false, loading: () => null },
);
const OutcomeProofSection = dynamic(
  () => import('./homepage/OutcomeProofSection').then((m) => m.OutcomeProofSection),
  { ssr: false, loading: () => null },
);
const ObjectionHandlingSection = dynamic(
  () => import('./homepage/ObjectionHandlingSection').then((m) => m.ObjectionHandlingSection),
  { ssr: false, loading: () => null },
);
const ProcurementFlowSection = dynamic(
  () => import('./homepage/ProcurementFlowSection').then((m) => m.ProcurementFlowSection),
  { ssr: false, loading: () => null },
);
const CTASection = dynamic(() => import('./homepage/CTASection').then((m) => m.CTASection), {
  ssr: false,
  loading: () => null,
});
const TrustSection = dynamic(() => import('./homepage/TrustSection').then((m) => m.TrustSection), {
  ssr: false,
  loading: () => null,
});

// Interactive demo components (lazy-loaded, client-only)
const InteractiveDemo = dynamic(
  () => import('@/components/marketing/demo/InteractiveDemo'),
  { ssr: false, loading: () => null }
);
const EvidenceShowcase = dynamic(
  () => import('@/components/marketing/demo/EvidenceShowcase'),
  { ssr: false, loading: () => null }
);
const TaskShowcase = dynamic(
  () => import('@/components/marketing/demo/TaskShowcase'),
  { ssr: false, loading: () => null }
);

export default function FormaOSHomepage() {
  return (
    <MotionProvider>
      <div className="figma-homepage mk-page-bg relative min-h-screen overflow-x-hidden">
        {/* Page Sections */}
        <div className="mk-marketing-flow relative z-10">
          <HeroSection />
          <ValueProposition />
          <DeferredSection minHeight={720}>
            <InteractiveDemo />
          </DeferredSection>
          <DeferredSection minHeight={620}>
            <ScrollStory />
          </DeferredSection>
          <DeferredSection minHeight={720}>
            <ComplianceEngineDemo />
          </DeferredSection>
          <DeferredSection minHeight={640}>
            <CapabilitiesGrid />
          </DeferredSection>
          <DeferredSection minHeight={640}>
            <EvidenceShowcase />
          </DeferredSection>
          <DeferredSection minHeight={620}>
            <Industries />
          </DeferredSection>
          <DeferredSection minHeight={640}>
            <TaskShowcase />
          </DeferredSection>
          <DeferredSection minHeight={660}>
            <SecuritySection />
          </DeferredSection>
          <DeferredSection minHeight={620}>
            <OutcomeProofSection />
          </DeferredSection>
          <DeferredSection minHeight={620}>
            <ObjectionHandlingSection />
          </DeferredSection>
          <DeferredSection minHeight={620}>
            <ProcurementFlowSection />
          </DeferredSection>
          <DeferredSection minHeight={540}>
            <CTASection />
          </DeferredSection>
          <DeferredSection minHeight={560}>
            <TrustSection />
          </DeferredSection>
        </div>
      </div>
    </MotionProvider>
  );
}
