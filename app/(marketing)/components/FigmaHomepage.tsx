'use client';

import dynamic from 'next/dynamic';
import { MotionProvider } from './motion/MotionContext';
import { ComplianceProvider } from './webgl/useComplianceState';

import {
  HeroSection,
  ValueProposition,
  ScrollStory,
  ComplianceEngineDemo,
  CapabilitiesGrid,
  Industries,
  SecuritySection,
  OutcomeProofSection,
  ObjectionHandlingSection,
  CTASection,
  TrustSection,
} from './homepage';

// Lazy-load heavy rendering components
const CinematicField = dynamic(() => import('./motion/CinematicField'), {
  ssr: false,
  loading: () => null,
});
const WebGLNodeField = dynamic(() => import('./webgl/NodeField'), {
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
      <ComplianceProvider>
        <div className="figma-homepage relative min-h-screen bg-[#0a0f1c] overflow-x-hidden">
          {/* Global Particle Field */}
          <div className="fixed inset-0 z-0">
            <div className="opacity-40">
              <CinematicField />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
          </div>

          {/* Global WebGL Node System */}
          <div className="fixed inset-0 z-1 opacity-20 pointer-events-none">
            <WebGLNodeField state="model" />
          </div>

          {/* Page Sections */}
          <div className="relative z-10">
            <HeroSection />
            <ValueProposition />
            <InteractiveDemo />
            <ScrollStory />
            <ComplianceEngineDemo />
            <CapabilitiesGrid />
            <EvidenceShowcase />
            <Industries />
            <TaskShowcase />
            <SecuritySection />
            <OutcomeProofSection />
            <ObjectionHandlingSection />
            <CTASection />
            <TrustSection />
          </div>
        </div>
      </ComplianceProvider>
    </MotionProvider>
  );
}
