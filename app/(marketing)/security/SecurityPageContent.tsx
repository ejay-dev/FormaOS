'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { SecurityHero } from './SecurityHero';

const SecuritySafeguards = dynamic(
  () => import('./SecurityContent').then((m) => m.SecuritySafeguards),
  { ssr: false, loading: () => null },
);
const SecurityArchitectureLayers = dynamic(
  () => import('./SecurityContent').then((m) => m.SecurityArchitectureLayers),
  { ssr: false, loading: () => null },
);
const SecurityEvidenceChain = dynamic(
  () => import('./SecurityContent').then((m) => m.SecurityEvidenceChain),
  { ssr: false, loading: () => null },
);
const SecurityCTA = dynamic(
  () => import('./SecurityContent').then((m) => m.SecurityCTA),
  { ssr: false, loading: () => null },
);

export default function SecurityPageContent() {
  return (
    <MarketingPageShell>
      <SecurityHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={520}>
        <SecuritySafeguards />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={480}>
        <SecurityArchitectureLayers />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={400}>
        <SecurityEvidenceChain />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={480}>
        <SecurityCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
