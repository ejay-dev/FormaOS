'use client';

import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { OperationalScenarioProof } from '@/components/marketing/demo/OperationalScenarioProof';
import {
  ProductHero,
  WhatIsFormaOS,
  ObligationToExecution,
  OperatingModel,
  WhatMakesDifferent,
  EnterpriseSecurity,
  ComplianceIntelligence,
  BuiltForComplex,
  WhoIsFor,
  TheOutcome,
  FinalCTA,
  InteractiveProductTour,
} from './components';

export default function ProductPageContent() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]" />
        <div className="absolute inset-0 opacity-30">
          <CinematicField />
        </div>
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <ProductHero />
        <WhatIsFormaOS />
        <VisualDivider />
        <InteractiveProductTour />
        <VisualDivider />
        <ObligationToExecution />
        <VisualDivider />
        <OperatingModel />
        <VisualDivider />
        <WhatMakesDifferent />
        <VisualDivider />
        <EnterpriseSecurity />
        <ComplianceIntelligence />
        <BuiltForComplex />
        <WhoIsFor />
        <VisualDivider />
        <OperationalScenarioProof />
        <VisualDivider />
        <TheOutcome />
        <FinalCTA />
      </div>
    </div>
  );
}
