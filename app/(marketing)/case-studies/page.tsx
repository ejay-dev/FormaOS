import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProofSection } from '@/components/ProofSection';
import { SectionEyebrow } from '@/components/marketing/SystemMarketingPrimitives';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Case Studies - FormaOS Compliance Proof',
  description:
    'Representative FormaOS proof packs showing audit preparation, governed workflows, and evidence trails for regulated operators.',
  alternates: {
    canonical: `${siteUrl}/case-studies`,
  },
  openGraph: {
    title: 'FormaOS Case Studies',
    description:
      'See how FormaOS structures proof packs: baseline, workflow trail, evidence, and operational outcome.',
    url: `${siteUrl}/case-studies`,
    type: 'website',
  },
};

export default function CaseStudiesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <section className="relative isolate overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.13),transparent_30%),linear-gradient(180deg,#020617_0%,#061525_48%,#020617_100%)]" />
        <div className="mk-security-grid pointer-events-none absolute inset-0 opacity-[0.2] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_74%)]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionEyebrow>Case Studies</SectionEyebrow>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Representative proof packs for regulated teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Explore how FormaOS presents readiness to auditors, procurement
            teams, and boards: the starting point, the governed workflow, the
            evidence chain, and the outcome.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?type=case-study&source=case_studies"
              className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              Build a Proof Walkthrough
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="mk-btn mk-btn-secondary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-8 grid max-w-3xl gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="border-l border-cyan-300/25 pl-4">
              <p className="font-semibold text-white">Baseline</p>
              <p className="mt-1 text-slate-400">What the team was managing manually.</p>
            </div>
            <div className="border-l border-cyan-300/25 pl-4">
              <p className="font-semibold text-white">Workflow</p>
              <p className="mt-1 text-slate-400">How controls, owners, and gates ran.</p>
            </div>
            <div className="border-l border-cyan-300/25 pl-4">
              <p className="font-semibold text-white">Evidence</p>
              <p className="mt-1 text-slate-400">What can be exported and reviewed.</p>
            </div>
          </div>
        </div>
      </section>
      <ProofSection showCta={false} />
    </main>
  );
}
