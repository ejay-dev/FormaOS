import type { Metadata } from 'next';
import ChildcareComplianceContent from './ChildcareComplianceContent';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';

const childcareServiceSchema = serviceSchema({
  name: 'Childcare Compliance Management Software',
  description:
    'NQF quality area tracking, educator credential management, QIP builder, and child safety workflows for Australian childcare services.',
  url: `${siteUrl}/childcare-compliance`,
});

const childcareFaqSchema = faqSchema([
  {
    question: 'Does FormaOS cover all 7 NQF quality areas?',
    answer:
      'Yes. FormaOS maps all 7 quality areas of the National Quality Framework with element-level detail, so your service tracks compliance at the most granular level ACECQA assesses.',
  },
  {
    question: 'Can FormaOS help build a Quality Improvement Plan?',
    answer:
      'Yes. FormaOS includes a structured QIP builder that links improvement actions to specific NQF quality areas and elements, with progress tracking and evidence attachment.',
  },
  {
    question: 'Does FormaOS track educator qualifications?',
    answer:
      'Yes. FormaOS tracks educator qualifications, Working with Children Checks, first aid certifications, and mandatory training requirements with automated expiry alerts.',
  },
  {
    question: 'How does FormaOS handle child safety requirements?',
    answer:
      'FormaOS includes child safety workflows for incident reporting, risk assessment, and regulatory notification aligned with state and territory child protection requirements.',
  },
  {
    question: 'Is FormaOS suitable for multi-site childcare providers?',
    answer:
      'Yes. FormaOS supports multi-site operations with centralised compliance oversight, per-site quality area tracking, and consolidated reporting across all your services.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Childcare Compliance Software — NQF, ACECQA & Child Safety | FormaOS',
  description:
    "Operationalise ACECQA's National Quality Framework across all 7 quality areas. Educator credential tracking, QIP builder, child safety workflows. Assessment-ready every day.",
  keywords: [
    'childcare compliance software Australia',
    'NQF compliance software',
    'ACECQA compliance',
    'National Quality Framework software',
    'QIP builder',
    'educator credential tracking',
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
  alternates: { canonical: `${siteUrl}/childcare-compliance` },
  openGraph: {
    title:
      'Childcare Compliance Software — NQF, ACECQA & Child Safety | FormaOS',
    description:
      'Operationalise the National Quality Framework across all 7 quality areas. Educator credential tracking, QIP builder, and child safety workflows.',
    url: `${siteUrl}/childcare-compliance`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Childcare Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Childcare Compliance Software — NQF, ACECQA & Child Safety | FormaOS',
    description:
      'Operationalise the NQF across all 7 quality areas. Educator credentials, QIP builder, child safety workflows.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function ChildcareCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'Childcare Compliance', path: '/childcare-compliance' },
            ]),
            childcareServiceSchema,
            childcareFaqSchema,
          ]),
        }}
      />
      <ChildcareComplianceContent />
    </>
  );
}
