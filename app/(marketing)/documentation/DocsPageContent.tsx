'use client';

import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DocsHero, DocsContent, APIPreview, DocsCTA } from './components';

export default function DocsPageContent() {
  return (
    <MarketingPageShell className="mk-page-bg">
      <DocsHero />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={420}>
        <DocsContent />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={400}>
        <APIPreview />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={250}>
        <DocsCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
