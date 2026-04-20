import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FailurePrevention } from '@/components/FailurePrevention';
import { ProductShowcase } from '@/components/ProductShowcase';
import { ProofSection } from '@/components/ProofSection';
import { ROIMetrics } from '@/components/ROIMetrics';
import { TrustBar } from '@/components/TrustBar';
import { WorkflowEnforcementDiagram } from '@/components/WorkflowEnforcementDiagram';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Case Studies - FormaOS Compliance Proof',
  description:
    'Representative FormaOS compliance proof packs showing before/after audit preparation, enforced workflows, and evidence trails for regulated operators.',
  alternates: {
    canonical: `${siteUrl}/case-studies`,
  },
  openGraph: {
    title: 'FormaOS Case Studies',
    description:
      'See the structure FormaOS uses to prove audit readiness: outcomes, workflow trail, evidence preview, and risk reduction.',
    url: `${siteUrl}/case-studies`,
    type: 'website',
  },
};

export default function CaseStudiesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Case Studies
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Proof packs for buyers who need evidence before belief
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This page shows the case-study structure FormaOS should use for
            NDIS and healthcare buyers: before/after metrics, workflow evidence,
            audit trail preview, and failure-prevention logic.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?type=case-study&source=case_studies"
              className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              Build My Proof Plan
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="mk-btn mk-btn-secondary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
      <TrustBar />
      <ProofSection showCta={false} />
      <ROIMetrics
        eyebrow="Outcome Model"
        title="The buyer needs to see time saved, risk controlled, and evidence produced"
      />
      <ProductShowcase />
      <WorkflowEnforcementDiagram />
      <FailurePrevention />
    </main>
  );
}
