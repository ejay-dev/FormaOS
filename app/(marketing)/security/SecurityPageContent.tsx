'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { SecurityHero } from './SecurityHero';

const SecurityContent = dynamic(
  () => import('./SecurityContent').then((m) => m.SecurityContent),
  { ssr: false, loading: () => null },
);

export default function SecurityPageContent() {
  return (
    <MarketingPageShell>
      <SecurityHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={1200}>
        <SecurityContent />
      </DeferredSection>
    </MarketingPageShell>
  );
}
