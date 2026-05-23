import type { Metadata } from 'next';
import NDISProvidersContent from './NDISProvidersContent';
import { KeyFacts } from '../components/shared/KeyFacts';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';

const ndisServiceSchema = serviceSchema({
  name: 'NDIS Compliance Management Software',
  description:
    'NDIS Practice Standards compliance management for registered NDIS providers. Worker screening, SIRS notifications, and audit-ready evidence.',
  url: `${siteUrl}/ndis-providers`,
});

const ndisFaqSchema = faqSchema([
  {
    question: 'Does FormaOS cover all 8 NDIS Practice Standards modules?',
    answer:
      'Yes. All 8 modules are pre-built including the Verification module for lower-risk providers and supplementary modules for specialist disability accommodation and early childhood supports.',
  },
  {
    question: 'Can FormaOS help with unannounced audits?',
    answer:
      'FormaOS maintains continuous evidence chains so your compliance posture is audit-ready at all times - not just before scheduled visits. When the NDIS Commission arrives unannounced, your evidence pack is one click away.',
  },
  {
    question: 'Does FormaOS handle SIRS notifications?',
    answer:
      'Yes. FormaOS tracks Priority and Standard reportable incidents with 24-hour and 5-business-day notification timers and submission status tracking.',
  },
  {
    question: 'How does FormaOS handle state-specific worker screening?',
    answer:
      'FormaOS tracks NDIS Worker Screening Check requirements by state and territory. Each jurisdiction has different screening units and processes - FormaOS maps these automatically and alerts you to expiring clearances.',
  },
  {
    question: 'Is my data stored in Australia?',
    answer:
      'Yes. FormaOS is AU-hosted by default. All participant data, evidence, and compliance records remain on Australian infrastructure. Your data never leaves Australia.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title:
    'NDIS Compliance Software | FormaOS',
  description:
    'Operationalise all 8 NDIS Practice Standards modules. Worker screening tracking, SIRS notifications, audit-ready evidence. Aligned with NDIS Practice Standards.',
  keywords: [
    'NDIS compliance software',
    'NDIS practice standards',
    'NDIS audit software',
    'NDIS Commission compliance',
    'worker screening NDIS',
    'SIRS notification software',
    'disability compliance software',
    'NDIS evidence management',
  ],
  authors: [{ name: 'FormaOS' }],
  creator: 'FormaOS',
  publisher: 'FormaOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: { canonical: `${siteUrl}/ndis-providers` },
  openGraph: {
    title:
      'NDIS Compliance Software | FormaOS',
    description:
      'Operationalise all 8 NDIS Practice Standards modules. Worker screening tracking, SIRS notifications, and audit-ready evidence packs for registered providers.',
    url: `${siteUrl}/ndis-providers`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'NDIS Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'NDIS Compliance Software | FormaOS',
    description:
      'Operationalise all 8 NDIS Practice Standards modules. Worker screening, SIRS notifications, audit-ready evidence.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function NDISProvidersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'NDIS Providers', path: '/ndis-providers' },
            ]),
            ndisServiceSchema,
            ndisFaqSchema,
          ]),
        }}
      />
      {/* AEO key-facts block — renders in initial SSR HTML so AI answer
          engines and procurement scanners hit citable claims first. */}
      <KeyFacts
        summary="FormaOS is a compliance operating system for registered NDIS providers, mapped to all 8 Practice Standards modules with SIRS notifications, worker screening tracking, and continuous audit-readiness for the NDIS Commission."
        facts={[
          { label: 'Frameworks covered', value: 'All 8 NDIS Practice Standards modules, plus supplementary SDA and early childhood modules' },
          { label: 'Worker screening', value: 'NDIS Worker Screening Check tracking per worker, alerts on expiry, jurisdiction-aware' },
          { label: 'SIRS', value: 'Priority (24-hour) and Standard (5-business-day) reportable incident workflows built in' },
          { label: 'Audit readiness', value: 'Continuous — unannounced audits ship with the same evidence bundle as scheduled' },
          { label: 'Hosting', value: 'AU-hosted (Sydney). Participant data never leaves Australia.' },
          { label: 'Built for', value: 'Registered NDIS providers under the Quality and Safeguards Commission' },
        ]}
      />
      <NDISProvidersContent />
    </>
  );
}
