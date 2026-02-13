'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { ProductHero } from './components';

const CinematicField = dynamic(() => import('../components/motion/CinematicField'), {
  ssr: false,
  loading: () => null,
});
const InteractiveProductTour = dynamic(
  () => import('@/components/marketing/demo/InteractiveProductTour').then((m) => m.InteractiveProductTour),
  { ssr: false, loading: () => null },
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
  const shouldReduceMotion = useReducedMotion();
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);
  const [enableBackgroundVisuals, setEnableBackgroundVisuals] = useState(false);

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || !allowHeavyVisuals) {
      setEnableBackgroundVisuals(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    const onIdle = () => setEnableBackgroundVisuals(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(onIdle, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(onIdle, 500);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [allowHeavyVisuals, shouldReduceMotion]);

  return (
    <div className="relative min-h-screen overflow-x-hidden mk-page-bg">
      {/* Page-specific depth accent layered over the shared marketing background */}
      {!shouldReduceMotion && allowHeavyVisuals && enableBackgroundVisuals && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-18">
            <CinematicField />
          </div>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        <ProductHero />
        <DeferredSection minHeight={640}>
          <WhatIsFormaOS />
        </DeferredSection>
        <VisualDivider />
        <DeferredSection minHeight={760}>
          <InteractiveProductTour />
        </DeferredSection>
        <VisualDivider />
        <DeferredSection minHeight={620}>
          <ObligationToExecution />
        </DeferredSection>
        <VisualDivider />
        <DeferredSection minHeight={620}>
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
      </div>
    </div>
  );
}
