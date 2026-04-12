'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { VisualDivider } from '@/components/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
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
      <div style={{ minHeight: '520px', background: '#030712' }} />
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

export default function SecurityPageContent() {
  return (
    <MarketingPageShell>
      <SecurityHero />

      {/* Security Pipeline section (lightweight, no WebGL) */}
      <LaserFlowSection />

      <FrameworkTrustStrip className="mt-2 mb-2" />
      <VisualDivider gradient />
      <DeferredSection minHeight={520}>
        <SecuritySafeguards />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={480}>
        <SecurityArchitectureLayers />
      </DeferredSection>

      {/* Mid-page trust conversion CTA */}
      <DeferredSection minHeight={100}>
        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <ScrollReveal variant="slideUp" range={[0, 0.3]}>
            <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-r from-emerald-500/[0.05] via-white/[0.03] to-teal-500/[0.05] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Security review packet ready
                  </h3>
                  <p className="text-xs text-slate-400">
                    Architecture, encryption, identity governance, data
                    residency, and DPA - all in one bundle.
                  </p>
                </div>
              </div>
              <Link
                href="/security-review"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:brightness-110 flex-shrink-0"
              >
                Review Packet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </ScrollReveal>
        </section>
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
