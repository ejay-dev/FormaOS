'use client';

import { VisualDivider } from '@/components/motion';
import {
  SecurityHero,
  SecurityArchitecture,
  EvidenceIntegrity,
  ComplianceByDesign,
  FinalSecurityCTA,
} from './components';

export default function SecurityPageContent() {
  return (
    <div className="min-h-screen text-white overflow-hidden">
      <SecurityHero />
      <VisualDivider gradient />
      <SecurityArchitecture />
      <VisualDivider />
      <EvidenceIntegrity />
      <VisualDivider gradient />
      <ComplianceByDesign />
      <VisualDivider />
      <FinalSecurityCTA />
    </div>
  );
}
