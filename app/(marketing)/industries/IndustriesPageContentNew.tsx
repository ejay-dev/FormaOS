'use client';

import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  CrossIndustryPrinciples,
  IndustriesCTA,
  IndustriesHero,
  IndustryVerticals,
  MissionCriticalContext,
} from './components';

export default function IndustriesPageContent() {
  return (
    <main className="relative">
      {/* JSON-LD handled in page.tsx */}

      {/* Hero with photographic backdrop */}
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/industries.jpg"
          objectPosition="50% 40%"
          opacity={0.12}
          scrim="center"
        />
        <IndustriesHero />
      </div>

      {/* No single vertical is deep-dived here: the six cards above are the
          route to each industry page, which carries that detail. */}
      <IndustryVerticals />
      <MissionCriticalContext />
      <CrossIndustryPrinciples />

      {/* Closing CTA with photographic backdrop */}
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/use-case-ndis-aged-care.jpg"
          objectPosition="50% 40%"
          opacity={0.15}
          scrim="center"
        />
        <IndustriesCTA />
      </div>
    </main>
  );
}
