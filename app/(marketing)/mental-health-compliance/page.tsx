import type { Metadata } from 'next';
import MentalHealthComplianceContent from './MentalHealthComplianceContent';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

const mentalHealthServiceSchema = serviceSchema({
  name: 'Mental Health Services Compliance Software',
  description:
    'Compliance management aligned with the National Standards for Mental Health Services (NSMHS). Consumer rights, restrictive practice governance, reportable incidents, and audit-ready evidence.',
  url: `${siteUrl}/mental-health-compliance`,
});

const mentalHealthFaqSchema = faqSchema([
  {
    question:
      'Does FormaOS cover the National Standards for Mental Health Services?',
    answer:
      'Yes. FormaOS ships the NSMHS as a pre-built framework so your obligations across the ten standards are mapped from day one — no manual setup required.',
  },
  {
    question: 'Can FormaOS track restrictive practices?',
    answer:
      'Yes. FormaOS maintains a restrictive practices register per consumer, links seclusion and restraint events to authorisations and review cycles, and keeps the documentation needed to evidence minimisation and oversight.',
  },
  {
    question: 'How does FormaOS handle reportable incidents?',
    answer:
      'FormaOS tracks reportable incidents through a structured pipeline — report, investigation, notification, and closure — with notification timers and submission status so deadlines are not missed.',
  },
  {
    question: 'Does FormaOS track worker screening for clinical staff?',
    answer:
      'Yes. FormaOS tracks worker screening clearances, police checks, and professional qualifications per staff member, with automatic expiry alerts before clearances lapse.',
  },
  {
    question: 'Is my data stored in Australia?',
    answer:
      'Yes. FormaOS is AU-hosted by default. All consumer data, evidence, and compliance records remain on Australian infrastructure. Your data never leaves Australia.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Mental Health Compliance Software | FormaOS',
  description:
    'Operationalise the National Standards for Mental Health Services. Consumer rights, restrictive practice governance, reportable incidents, and audit-ready evidence.',
  keywords: [
    'mental health compliance software',
    'National Standards for Mental Health Services',
    'NSMHS compliance',
    'mental health services audit software',
    'restrictive practices register',
    'reportable incident software',
    'consumer rights mental health',
    'mental health evidence management',
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
  alternates: { canonical: `${siteUrl}/mental-health-compliance` },
  openGraph: {
    title: 'Mental Health Compliance Software | FormaOS',
    description:
      'Operationalise the National Standards for Mental Health Services. Consumer rights, restrictive practice governance, reportable incidents, and audit-ready evidence.',
    url: `${siteUrl}/mental-health-compliance`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Mental Health Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mental Health Compliance Software | FormaOS',
    description:
      'Operationalise the National Standards for Mental Health Services. Consumer rights, restrictive practices, reportable incidents, audit-ready evidence.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function MentalHealthCompliancePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Industries', path: '/industries' },
            { name: 'Mental Health Services', path: '/mental-health-compliance' },
          ]),
          mentalHealthServiceSchema,
          mentalHealthFaqSchema,
        ]}
      />
      <MentalHealthComplianceContent />
    </>
  );
}
