'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { DeferredSection } from './shared';
import { HeroSection } from './homepage';
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

// Below-fold client sections. Each one now has a distinct job: the demo shows
// the engine running, industries answers "is this built for me", scenarios
// answer "what does it change", the CTA closes. Sections that re-told the
// obligation → control → evidence story a second and third time were removed
// rather than re-skinned.
const Industries = dynamic(
  () => import('./homepage/Industries').then((m) => m.Industries),
  { ssr: false, loading: () => null },
);
const CTASection = dynamic(
  () => import('./homepage/CTASection').then((m) => m.CTASection),
  { ssr: false, loading: () => null },
);
const TestimonialsSection = dynamic(
  () =>
    import('./homepage/TestimonialsSection').then((m) => m.TestimonialsSection),
  { ssr: false, loading: () => null },
);
const InteractiveDemo = dynamic(
  () => import('@/components/marketing/demo/InteractiveDemo'),
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
        <div className="mk-marketing-flow relative z-10">
          {!skipHero && renderSection('hero', <HeroSection />)}
          {sectionVisibility.interactive_demo !== false
            ? renderSection('interactive_demo', <InteractiveDemo />, 520)
            : null}
          {sectionVisibility.industries !== false
            ? renderSection('industries', <Industries />, 440)
            : null}
          <DeferredSection minHeight={380}>
            <TestimonialsSection />
          </DeferredSection>
          {sectionVisibility.cta !== false
            ? renderSection('cta', <CTASection />, 380)
            : null}
        </div>
      </div>
    </MotionProvider>
  );
}
