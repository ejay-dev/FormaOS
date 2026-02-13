'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { TrustHero } from './components';

const TrustModules = dynamic(
  () => import('./components/TrustModules').then((m) => m.TrustModules),
  { ssr: false, loading: () => null },
);

const TrustWorkflow = dynamic(
  () => import('./components/TrustWorkflow').then((m) => m.TrustWorkflow),
  { ssr: false, loading: () => null },
);

const QuestionnaireAccelerator = dynamic(
  () =>
    import('./components/QuestionnaireAccelerator').then(
      (m) => m.QuestionnaireAccelerator,
    ),
  { ssr: false, loading: () => null },
);

export default function TrustPageContent() {
  return (
    <MarketingPageShell>
      <TrustHero />
      <VisualDivider />
      <DeferredSection minHeight={520}>
        <TrustModules />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={400}>
        <TrustWorkflow />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <QuestionnaireAccelerator />
      </DeferredSection>
    </MarketingPageShell>
  );
}
