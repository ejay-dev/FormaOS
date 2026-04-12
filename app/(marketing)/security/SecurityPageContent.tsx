'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, FileText, Clock } from 'lucide-react';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { SecurityHero } from './SecurityHero';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';

const LaserFlowSection = dynamic(
  () =>
    import(
      /* webpackChunkName: "marketing-threejs" */ './LaserFlowSection'
    ).then((m) => m.LaserFlowSection),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '420px', background: '#030712' }} />
    ),
  },
);
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

/* ── Inline mid-page trust CTA (no DeferredSection wrapper) ── */
function SecurityReviewBanner() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-emerald-500/[0.06] via-white/[0.02] to-teal-500/[0.06] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Security review packet ready for your procurement team
              </h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-xl">
                Architecture overview, encryption protocols, identity governance, data residency details, and DPA - bundled and ready.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  PDF + live portal
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  No wait time
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto">
            <Link
              href="/security-review"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:brightness-110 w-full lg:w-auto"
            >
              Review Packet
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 w-full lg:w-auto"
            >
              Trust Center
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Thin decorative divider (replaces VisualDivider's bloated margins) ── */
function SectionDivider() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export default function SecurityPageContent() {
  return (
    <MarketingPageShell>
      <SecurityHero />

      <LaserFlowSection />

      <FrameworkTrustStrip className="mt-1 mb-1" />

      <SectionDivider />

      <DeferredSection minHeight={380}>
        <SecuritySafeguards />
      </DeferredSection>

      <SectionDivider />

      <DeferredSection minHeight={360}>
        <SecurityArchitectureLayers />
      </DeferredSection>

      <SecurityReviewBanner />

      <SectionDivider />

      <DeferredSection minHeight={300}>
        <SecurityEvidenceChain />
      </DeferredSection>

      <SectionDivider />

      <DeferredSection minHeight={360}>
        <SecurityCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
