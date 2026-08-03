import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Case Studies - FormaOS',
  description:
    'FormaOS has no published customer case studies yet. This page sets out the structure each one will follow and what a buyer can review in the meantime.',
  alternates: {
    canonical: `${siteUrl}/case-studies`,
  },
  openGraph: {
    title: 'Case Studies | FormaOS',
    description:
      'No customer case studies published yet. Here is the structure each one will follow, and what can be reviewed today.',
    url: `${siteUrl}/case-studies`,
    type: 'website',
  },
};

const studyStructure = [
  {
    title: 'Baseline',
    detail: 'What the team was managing manually before, in their own numbers.',
  },
  {
    title: 'Governed workflow',
    detail: 'Which controls ran, who owned them, and where work was blocked.',
  },
  {
    title: 'Evidence chain',
    detail: 'The export an auditor received, and how it can be verified.',
  },
  {
    title: 'Outcome',
    detail: 'What changed, measured against the baseline and approved by them.',
  },
];

const availableToday = [
  {
    href: '/customer-stories',
    label: 'Use-case scenarios',
    detail:
      'Four regulated-industry scenarios, labelled as illustrative rather than dressed up as deployments.',
  },
  {
    href: '/trust',
    label: 'Trust centre',
    detail:
      'Hosting, subprocessors, data handling and the security posture as it stands today.',
  },
  {
    href: '/security-review',
    label: 'Security review packet',
    detail:
      'The material a procurement or security team asks for during evaluation.',
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#181a1c] text-white">
      <section className="relative isolate overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#181a1c_0%,#181a1c_48%,#181a1c_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            No case studies yet
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            FormaOS is early and no customer has agreed to be named. A
            compliance product that invents its own proof has no business
            selling verifiable evidence, so this page stays empty until there is
            a real study to publish.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            When one goes up it will have four parts, with the numbers supplied
            and approved by the organisation they belong to.
          </p>

          <div className="mt-10 grid max-w-4xl gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
            {studyStructure.map((part) => (
              <div key={part.title} className="border-l border-white/15 pl-4">
                <p className="font-semibold text-white">{part.title}</p>
                <p className="mt-1 text-zinc-400">{part.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 max-w-4xl rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 lg:p-9">
            <h2 className="text-xl font-semibold text-white">
              What you can review today
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {availableToday.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={compliancePlanHref('case_studies')}
              className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              {PUBLIC_CTA_LABELS.compliancePlan}
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
    </main>
  );
}
