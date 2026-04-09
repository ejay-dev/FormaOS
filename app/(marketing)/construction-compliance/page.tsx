import type { Metadata } from 'next';
import ConstructionComplianceContent from './ConstructionComplianceContent';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';

const constructionServiceSchema = serviceSchema({
  name: 'Construction WHS Compliance Management Software',
  description:
    'WHS Act compliance, SWMS registers, contractor induction tracking, and SafeWork incident notifications for Australian construction and infrastructure.',
  url: `${siteUrl}/construction-compliance`,
});

const constructionFaqSchema = faqSchema([
  {
    question: 'Does FormaOS manage SWMS registers?',
    answer:
      'Yes. FormaOS maintains a structured SWMS register with version control, worker acknowledgement tracking, and automated review reminders for high risk construction work.',
  },
  {
    question: 'Can FormaOS track contractor inductions?',
    answer:
      'Yes. FormaOS tracks contractor induction completion, insurance certificates, licences, and compliance documentation across all your project sites.',
  },
  {
    question: 'How does FormaOS handle SafeWork notifications?',
    answer:
      'FormaOS includes structured workflows for notifiable incident reporting to the relevant state or territory SafeWork authority, with notification timers and submission tracking.',
  },
  {
    question: 'Does FormaOS support multi-site operations?',
    answer:
      'Yes. FormaOS provides per-site compliance dashboards with centralised oversight, so head office can monitor WHS compliance across all active project sites simultaneously.',
  },
  {
    question: 'Can FormaOS track high risk work licences?',
    answer:
      'Yes. FormaOS tracks high risk work licences for activities like crane operation, scaffolding, rigging, and dogging with automated expiry alerts and competency verification.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title:
    'Construction WHS Compliance Software — SafeWork & Site Safety | FormaOS',
  description:
    'Manage WHS Act obligations, SWMS registers, contractor inductions, and SafeWork incident notifications. Multi-site compliance for Australian construction and infrastructure.',
  keywords: [
    'construction compliance software Australia',
    'WHS compliance software',
    'SafeWork compliance',
    'SWMS management software',
    'contractor compliance tracking',
    'construction safety management',
    'high risk work licence',
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
  alternates: { canonical: `${siteUrl}/construction-compliance` },
  openGraph: {
    title:
      'Construction WHS Compliance Software — SafeWork & Site Safety | FormaOS',
    description:
      'Manage WHS Act obligations, SWMS registers, contractor inductions, and SafeWork incident notifications for Australian construction.',
    url: `${siteUrl}/construction-compliance`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Construction WHS Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Construction WHS Compliance Software — SafeWork & Site Safety | FormaOS',
    description:
      'Manage WHS Act obligations, SWMS registers, contractor inductions, and SafeWork notifications for Australian construction.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function ConstructionCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              {
                name: 'Construction Compliance',
                path: '/construction-compliance',
              },
            ]),
            constructionServiceSchema,
            constructionFaqSchema,
          ]),
        }}
      />
      <ConstructionComplianceContent />
    </>
  );
}
