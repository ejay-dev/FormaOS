'use client';

import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DocsHero, DocsContent, APIPreview, DocsCTA } from './components';

export default function DocsPageContent() {
  return (
    <MarketingPageShell className="mk-page-bg" enableCinematicField={false}>
      <DocsHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={600}>
        <DocsContent />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={400}>
        <APIPreview />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={250}>
        <DocsCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
