import type { Metadata } from 'next';
import ChangelogPageContent from './ChangelogPageContent';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS Changelog | Compliance Infrastructure Product Updates',
  description:
    'Latest FormaOS product updates across compliance workflows, audit readiness, evidence management, onboarding, care operations, and system infrastructure.',
  keywords: [
    'FormaOS changelog',
    'compliance operating system updates',
    'audit readiness product updates',
    'evidence workflow changelog',
    'compliance infrastructure',
  ],
  alternates: { canonical: `${siteUrl}/changelog` },
  openGraph: {
    title: 'FormaOS Changelog | Compliance Infrastructure Updates',
    description:
      'Product updates across compliance workflows, evidence, audit readiness, onboarding, and system infrastructure.',
    type: 'website',
    url: `${siteUrl}/changelog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS Changelog | Compliance Infrastructure Updates',
    description:
      'Latest FormaOS releases across evidence workflows, audit readiness, onboarding, and care operations.',
  },
};

export default function ChangelogPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'FormaOS Changelog',
    description:
      'Product updates across compliance workflows, evidence, audit readiness, onboarding, care operations, and system infrastructure.',
    url: `${siteUrl}/changelog`,
    about: [
      'Compliance workflows',
      'Evidence management',
      'Audit readiness',
      'Care operations',
      'Compliance infrastructure',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ChangelogPageContent />
    </>
  );
}
