'use client';

import { type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { TrustHero } from './components';
import { TrustSubpagesIndex } from './components/TrustSubpagesIndex';
import { AuditChainProof } from './components/AuditChainProof';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';

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

export default function TrustPageContent({
  leadContent,
}: {
  leadContent?: ReactNode;
}) {
  return (
    <MarketingPageShell>
      <TrustHero />
      {leadContent}
      <FrameworkTrustStrip className="mt-2 mb-2" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      {/* SSR-rendered cryptographic audit-chain proof. Backs up the
          homepage AuditChainSection's claim chain; must land in the
          initial HTML response so crawlers and answer engines can index
          the Merkle + Sigstore Rekor + RLS claims (lib/audit/merkle.ts,
          lib/audit/external-anchor.ts, audit-chain-anchor cron). */}
      <AuditChainProof />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      {/* SSR-rendered index of trust sub-pages. Sits outside DeferredSection
          so it lands in the initial HTML response, crawlers and screen
          readers reach every Trust Center document without needing to
          hydrate the dynamic TrustModules visual below. */}
      <TrustSubpagesIndex />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={520}>
        <TrustModules />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={400}>
        <TrustWorkflow />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={560}>
        <QuestionnaireAccelerator />
      </DeferredSection>
    </MarketingPageShell>
  );
}
