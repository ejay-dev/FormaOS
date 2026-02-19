'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MotionProvider } from './motion/MotionContext';
import { ComplianceProvider } from './webgl/useComplianceState';
import { DeferredSection } from './shared';
import { HeroSection, ValueProposition } from './homepage';

// Lazy-load heavy rendering components
const WebGLNodeField = dynamic(() => import('./webgl/NodeField'), {
  ssr: false,
  loading: () => null,
});
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
  const shouldReduceMotion = useReducedMotion();
  const [enableHeavyVisuals, setEnableHeavyVisuals] = useState(false);
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!allowHeavyVisuals) {
      setEnableHeavyVisuals(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const onIdle = () => setEnableHeavyVisuals(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(onIdle, { timeout: 1000 });
    } else {
      timeoutId = setTimeout(onIdle, 320);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [allowHeavyVisuals, shouldReduceMotion]);

  return (
    <MotionProvider>
      <ComplianceProvider>
        <div className="figma-homepage mk-page-bg relative min-h-screen overflow-x-hidden">
          {/* Global Particle Field */}
          {!shouldReduceMotion && allowHeavyVisuals && enableHeavyVisuals && (
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
            </div>
          )}

          {/* Global WebGL Node System */}
          {!shouldReduceMotion && allowHeavyVisuals && enableHeavyVisuals && (
            <div className="fixed inset-0 z-1 opacity-20 pointer-events-none">
              <WebGLNodeField state="model" />
            </div>
          )}

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
      </ComplianceProvider>
    </MotionProvider>
  );
}
