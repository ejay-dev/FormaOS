'use client';

import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { IndustriesHero } from './components';

const MissionCriticalContext = dynamic(
  () => import('./components/MissionCriticalContext').then((m) => m.MissionCriticalContext),
  { ssr: false, loading: () => null },
);
const IndustryVerticals = dynamic(
  () => import('./components/IndustryVerticals').then((m) => m.IndustryVerticals),
  { ssr: false, loading: () => null },
);
const CrossIndustryPrinciples = dynamic(
  () => import('./components/CrossIndustryPrinciples').then((m) => m.CrossIndustryPrinciples),
  { ssr: false, loading: () => null },
);
const NDISDeepDive = dynamic(
  () => import('./components/NDISDeepDive').then((m) => m.NDISDeepDive),
  { ssr: false, loading: () => null },
);
const HealthcareSection = dynamic(
  () => import('./components/HealthcareSection').then((m) => m.HealthcareSection),
  { ssr: false, loading: () => null },
);
const IndustriesCTA = dynamic(
  () => import('./components/IndustriesCTA').then((m) => m.IndustriesCTA),
  { ssr: false, loading: () => null },
);

export default function IndustriesPageContentNew() {
  return (
    <MarketingPageShell>
      <IndustriesHero />
      <VisualDivider />
      <DeferredSection minHeight={480}>
        <MissionCriticalContext />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={640}>
        <IndustryVerticals />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={780}>
        <CrossIndustryPrinciples />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={740}>
        <NDISDeepDive />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={680}>
        <HealthcareSection />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={620}>
        <IndustriesCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
