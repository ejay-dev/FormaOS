'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { DeferredSection } from './shared';
import {
  HeroSection,
  ValueProposition,
  ComplianceNetworkSection,
} from './homepage';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { useDeviceTier } from '@/lib/device-tier';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  decisionMapFromList,
  deriveHomepageMotionPolicy,
  deriveHomepageSectionDecisions,
  getHomepagePolicyHints,
  summarizeHomepageDecisions,
  type HomepageSectionKey,
} from '@/lib/marketing/homepage-experience';
import { useHomepageTelemetry } from '@/lib/marketing/homepage-telemetry';

// Lazy-load heavy rendering components
const ScrollStory = dynamic(
  () => import('./homepage/ScrollStory').then((m) => m.ScrollStory),
  {
    ssr: false,
    loading: () => null,
  },
);
const ComplianceEngineDemo = dynamic(
  () =>
    import('./homepage/ComplianceEngineDemo').then(
      (m) => m.ComplianceEngineDemo,
    ),
  { ssr: false, loading: () => null },
);
const CapabilitiesGrid = dynamic(
  () => import('./homepage/CapabilitiesGrid').then((m) => m.CapabilitiesGrid),
  { ssr: false, loading: () => null },
);
const Industries = dynamic(
  () => import('./homepage/Industries').then((m) => m.Industries),
  {
    ssr: false,
    loading: () => null,
  },
);
const SecuritySection = dynamic(
  () => import('./homepage/SecuritySection').then((m) => m.SecuritySection),
  { ssr: false, loading: () => null },
);
const OutcomeProofSection = dynamic(
  () =>
    import('./homepage/OutcomeProofSection').then((m) => m.OutcomeProofSection),
  { ssr: false, loading: () => null },
);
const ObjectionHandlingSection = dynamic(
  () =>
    import('./homepage/ObjectionHandlingSection').then(
      (m) => m.ObjectionHandlingSection,
    ),
  { ssr: false, loading: () => null },
);
// ProcurementFlowSection merged into ObjectionHandlingSection
const CTASection = dynamic(
  () => import('./homepage/CTASection').then((m) => m.CTASection),
  {
    ssr: false,
    loading: () => null,
  },
);
// TrustSection merged into SecuritySection
const TestimonialsSection = dynamic(
  () =>
    import('./homepage/TestimonialsSection').then((m) => m.TestimonialsSection),
  { ssr: false, loading: () => null },
);
// Interactive demo components (lazy-loaded, client-only)
const InteractiveDemo = dynamic(
  () => import('@/components/marketing/demo/InteractiveDemo'),
  { ssr: false, loading: () => null },
);
const EvidenceShowcase = dynamic(
  () => import('@/components/marketing/demo/EvidenceShowcase'),
  { ssr: false, loading: () => null },
);
const TaskShowcase = dynamic(
  () => import('@/components/marketing/demo/TaskShowcase'),
  { ssr: false, loading: () => null },
);

export default function FormaOSHomepage({
  skipHero = false,
}: {
  skipHero?: boolean;
}) {
  const { snapshot } = useControlPlaneRuntime();
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const runtime =
    snapshot?.marketing.runtime ?? DEFAULT_RUNTIME_MARKETING.runtime;
  const sectionVisibility = runtime.sectionVisibility;
  const motionPolicy = useMemo(
    () =>
      deriveHomepageMotionPolicy({
        reducedMotion: Boolean(shouldReduceMotion),
        expensiveEffectsEnabled: runtime.expensiveEffectsEnabled,
        pageVisible: true,
        heroInView: true,
        deviceTier: tierConfig.tier,
      }),
    [runtime.expensiveEffectsEnabled, shouldReduceMotion, tierConfig.tier],
  );
  const telemetry = useHomepageTelemetry(motionPolicy, { samplingRate: 0.75 });
  const sectionDecisions = useMemo(
    () => deriveHomepageSectionDecisions(runtime, motionPolicy),
    [motionPolicy, runtime],
  );
  const decisionMap = useMemo(
    () => decisionMapFromList(sectionDecisions),
    [sectionDecisions],
  );
  const summary = useMemo(
    () => summarizeHomepageDecisions(sectionDecisions),
    [sectionDecisions],
  );
  const hints = useMemo(
    () => getHomepagePolicyHints(motionPolicy),
    [motionPolicy],
  );
  const showcaseModules = runtime.showcaseModules;
  const enabledShowcases = Object.entries(showcaseModules)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
  const activeShowcase = enabledShowcases.includes(runtime.activeShowcaseModule)
    ? runtime.activeShowcaseModule
    : (enabledShowcases[0] ?? null);

  useEffect(() => {
    telemetry.trackRuntimeProfile({
      tier: tierConfig.tier,
      profile: motionPolicy.performanceProfile,
      deferredCount: summary.totalDeferred,
      visibleCount: summary.totalVisible,
      hints,
    });

    for (const decision of sectionDecisions) {
      telemetry.trackSectionRendered(decision.key, decision.deferred, {
        visible: decision.visible,
        critical: decision.critical,
        reason: decision.reason,
      });
    }
  }, [
    hints,
    motionPolicy.performanceProfile,
    sectionDecisions,
    summary.totalDeferred,
    summary.totalVisible,
    telemetry,
    tierConfig.tier,
  ]);

  const renderSection = (
    key: HomepageSectionKey,
    section: ReactNode,
    minHeight?: number,
  ) => {
    const decision = decisionMap[key];
    if (!decision || !decision.visible) return null;
    if (!decision.deferred) return section;

    return (
      <DeferredSection minHeight={minHeight ?? 300}>{section}</DeferredSection>
    );
  };

  return (
    <MotionProvider>
      <div className="figma-homepage relative min-h-screen overflow-x-hidden">
        {/* Page Sections */}
        <div className="mk-marketing-flow relative z-10">
          {!skipHero && renderSection('hero', <HeroSection />)}
          {renderSection(
            'framework_trust_strip',
            <FrameworkTrustStrip />,
            200,
          )}
          {sectionVisibility.value_proposition !== false
            ? renderSection('value_proposition', <ValueProposition />)
            : null}
          {sectionVisibility.compliance_network !== false
            ? renderSection(
                'compliance_network',
                <ComplianceNetworkSection />,
                440,
              )
            : null}
          {activeShowcase === 'interactive_demo' &&
          sectionVisibility.interactive_demo !== false
            ? renderSection('interactive_demo', <InteractiveDemo />, 520)
            : null}
          {sectionVisibility.scroll_story !== false
            ? renderSection('scroll_story', <ScrollStory />, 520)
            : null}
          {sectionVisibility.compliance_engine_demo !== false
            ? renderSection(
                'compliance_engine_demo',
                <ComplianceEngineDemo />,
                520,
              )
            : null}
          {sectionVisibility.capabilities_grid !== false
            ? renderSection('capabilities_grid', <CapabilitiesGrid />, 460)
            : null}
          {activeShowcase === 'evidence_showcase' &&
          sectionVisibility.evidence_showcase !== false
            ? renderSection('evidence_showcase', <EvidenceShowcase />, 460)
            : null}
          {sectionVisibility.industries !== false
            ? renderSection('industries', <Industries />, 440)
            : null}
          {activeShowcase === 'task_showcase' &&
          sectionVisibility.task_showcase !== false
            ? renderSection('task_showcase', <TaskShowcase />, 460)
            : null}
          {sectionVisibility.security !== false
            ? renderSection('security', <SecuritySection />, 480)
            : null}
          {sectionVisibility.outcome_proof !== false
            ? renderSection('outcome_proof', <OutcomeProofSection />, 440)
            : null}
          {/* Social proof - always shown; not gated by control plane */}
          <DeferredSection minHeight={380}>
            <TestimonialsSection />
          </DeferredSection>
          {sectionVisibility.objection_handling !== false
            ? renderSection(
                'objection_handling',
                <ObjectionHandlingSection />,
                440,
              )
            : null}
          {/* Procurement flow merged into ObjectionHandlingSection - skipped */}
          {sectionVisibility.cta !== false
            ? renderSection('cta', <CTASection />, 380)
            : null}
          {/* TrustSection merged into SecuritySection - skipped */}
        </div>
      </div>
    </MotionProvider>
  );
}
