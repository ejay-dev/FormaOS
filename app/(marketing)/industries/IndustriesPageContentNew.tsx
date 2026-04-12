'use client';

import dynamic from 'next/dynamic';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { IndustriesHero } from './components';

const MissionCriticalContext = dynamic(
  () =>
    import('./components/MissionCriticalContext').then(
      (m) => m.MissionCriticalContext,
    ),
  { ssr: false, loading: () => null },
);
const IndustryVerticals = dynamic(
  () =>
    import('./components/IndustryVerticals').then((m) => m.IndustryVerticals),
  { ssr: false, loading: () => null },
);
const CrossIndustryPrinciples = dynamic(
  () =>
    import('./components/CrossIndustryPrinciples').then(
      (m) => m.CrossIndustryPrinciples,
    ),
  { ssr: false, loading: () => null },
);
const NDISDeepDive = dynamic(
  () => import('./components/NDISDeepDive').then((m) => m.NDISDeepDive),
  { ssr: false, loading: () => null },
);
const HealthcareSection = dynamic(
  () =>
    import('./components/HealthcareSection').then((m) => m.HealthcareSection),
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={360}>
        <MissionCriticalContext />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={480}>
        <IndustryVerticals />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={560}>
        <CrossIndustryPrinciples />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={520}>
        <NDISDeepDive />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={480}>
        <HealthcareSection />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={440}>
        <IndustriesCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
