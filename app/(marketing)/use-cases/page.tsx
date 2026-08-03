import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';

export const dynamic = 'force-static';

const TITLE = 'Compliance Use Cases | FormaOS';
const DESCRIPTION =
  'Three operational problems FormaOS is built around: incident response, workforce credentials, and public-sector governance.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteUrl}/use-cases` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/use-cases`,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const USE_CASES = [
  {
    href: '/use-cases/incident-management',
    title: 'Incident management',
    description:
      'Intake, severity triage, investigation, corrective action and closure, with the chronology a regulator asks for already assembled.',
  },
  {
    href: '/use-cases/workforce-credentials',
    title: 'Workforce credentials',
    description:
      'Registration, screening and training records with named verifiers, renewal cadences, and point-in-time proof of who was credentialed when.',
  },
  {
    href: '/use-cases/government-public-sector',
    title: 'Government and public sector',
    description:
      'Policy approval chains, records-backed control evidence, and procurement assurance held in one decision history.',
  },
];

export default function UseCasesIndexPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Use Cases', path: '/use-cases' },
        ])}
      />
      <MarketingPageShell>
        <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-36">
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Three problems FormaOS was built around
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Each one starts as a workflow and ends as evidence. Pick the one
            closest to the work your team is accountable for.
          </p>

          <div className="mt-14 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {USE_CASES.map((useCase) => (
              <Link
                key={useCase.href}
                href={useCase.href}
                className="group flex flex-col gap-3 py-8 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-start sm:gap-10"
              >
                <h2 className="text-xl font-semibold text-white sm:w-64 sm:shrink-0">
                  {useCase.title}
                </h2>
                <p className="flex-1 text-base leading-relaxed text-slate-400">
                  {useCase.description}
                </p>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>

          <p className="mt-12 text-base text-slate-400">
            Looking for your sector rather than your workflow?{' '}
            <Link
              href="/industries"
              className="text-white underline underline-offset-4 hover:opacity-80"
            >
              See the six regulated industries FormaOS covers
            </Link>
            .
          </p>
        </section>
      </MarketingPageShell>
    </>
  );
}
