'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { DeferredSection } from './shared';
import { HeroSection, ValueProposition } from './homepage';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';

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
const ComplianceNetworkSection = dynamic(
  () => import('./homepage/ComplianceNetworkSection').then((m) => m.ComplianceNetworkSection),
  { ssr: false, loading: () => null },
);

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
  const { snapshot } = useControlPlaneRuntime();
  const runtime = snapshot?.marketing.runtime ?? DEFAULT_RUNTIME_MARKETING.runtime;
  const sectionVisibility = runtime.sectionVisibility;
  const showcaseModules = runtime.showcaseModules;
  const enabledShowcases = Object.entries(showcaseModules)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
  const activeShowcase =
    enabledShowcases.includes(runtime.activeShowcaseModule)
      ? runtime.activeShowcaseModule
      : (enabledShowcases[0] ?? null);

  return (
    <MotionProvider>
      <div className="figma-homepage mk-page-bg relative min-h-screen overflow-x-hidden">
        {/* Page Sections */}
        <div className="mk-marketing-flow relative z-10">
          <HeroSection />
          {sectionVisibility.value_proposition !== false ? <ValueProposition /> : null}
          {sectionVisibility.compliance_network !== false ? (
            <DeferredSection minHeight={620}>
              <ComplianceNetworkSection />
            </DeferredSection>
          ) : null}
          {activeShowcase === 'interactive_demo' &&
          sectionVisibility.interactive_demo !== false ? (
            <DeferredSection minHeight={720}>
              <InteractiveDemo />
            </DeferredSection>
          ) : null}
          {sectionVisibility.scroll_story !== false ? (
            <DeferredSection minHeight={720}>
              <ScrollStory />
            </DeferredSection>
          ) : null}
          {sectionVisibility.compliance_engine_demo !== false ? (
            <DeferredSection minHeight={720}>
              <ComplianceEngineDemo />
            </DeferredSection>
          ) : null}
          {sectionVisibility.capabilities_grid !== false ? (
            <DeferredSection minHeight={640}>
              <CapabilitiesGrid />
            </DeferredSection>
          ) : null}
          {activeShowcase === 'evidence_showcase' &&
          sectionVisibility.evidence_showcase !== false ? (
            <DeferredSection minHeight={640}>
              <EvidenceShowcase />
            </DeferredSection>
          ) : null}
          {sectionVisibility.industries !== false ? (
            <DeferredSection minHeight={620}>
              <Industries />
            </DeferredSection>
          ) : null}
          {activeShowcase === 'task_showcase' &&
          sectionVisibility.task_showcase !== false ? (
            <DeferredSection minHeight={640}>
              <TaskShowcase />
            </DeferredSection>
          ) : null}
          {sectionVisibility.security !== false ? (
            <DeferredSection minHeight={660}>
              <SecuritySection />
            </DeferredSection>
          ) : null}
          {sectionVisibility.outcome_proof !== false ? (
            <DeferredSection minHeight={620}>
              <OutcomeProofSection />
            </DeferredSection>
          ) : null}
          {sectionVisibility.objection_handling !== false ? (
            <DeferredSection minHeight={620}>
              <ObjectionHandlingSection />
            </DeferredSection>
          ) : null}
          {sectionVisibility.procurement_flow !== false ? (
            <DeferredSection minHeight={620}>
              <ProcurementFlowSection />
            </DeferredSection>
          ) : null}
          {sectionVisibility.cta !== false ? (
            <DeferredSection minHeight={540}>
              <CTASection />
            </DeferredSection>
          ) : null}
          {sectionVisibility.trust !== false ? (
            <DeferredSection minHeight={560}>
              <TrustSection />
            </DeferredSection>
          ) : null}
        </div>
      </div>
    </MotionProvider>
  );
}
