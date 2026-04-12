import type { Metadata } from 'next';
import HealthcareComplianceContent from './HealthcareComplianceContent';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';

const healthcareServiceSchema = serviceSchema({
  name: 'Healthcare Compliance Management Software',
  description:
    'AHPRA registration tracking, NSQHS Standards accreditation, CPD management, and clinical governance for Australian healthcare providers.',
  url: `${siteUrl}/healthcare-compliance`,
});

const healthcareFaqSchema = faqSchema([
  {
    question:
      'Does FormaOS track AHPRA registration for all 16 regulated professions?',
    answer:
      'Yes. FormaOS supports all 16 AHPRA-regulated health professions. Each profession has its own CPD requirements and renewal cycles, all tracked automatically.',
  },
  {
    question: 'How does FormaOS help with NSQHS accreditation?',
    answer:
      'FormaOS maps all 8 NSQHS standards with full criterion-level detail. Evidence is attached to specific actions as your team completes them, so accreditation readiness is continuous.',
  },
  {
    question: 'Can FormaOS track CPD hours for different professions?',
    answer:
      'Yes. Each AHPRA-regulated profession has unique CPD requirements. FormaOS tracks CPD hours per practitioner against their profession-specific requirements, with alerts when practitioners fall behind.',
  },
  {
    question: 'How long does setup take for a healthcare organisation?',
    answer:
      'Most healthcare organisations are fully operational within hours. FormaOS ships with NSQHS Standards, AHPRA registration obligations, Privacy Act requirements, and clinical governance frameworks pre-built.',
  },
  {
    question: 'What happens when NSQHS Standards are updated?',
    answer:
      'When the Australian Commission on Safety and Quality in Health Care updates NSQHS Standards, FormaOS pushes framework updates automatically. New criteria are added and gap analysis highlights new requirements.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title:
    'Healthcare Compliance Software - AHPRA, NSQHS & Clinical Governance | FormaOS',
  description:
    'Track AHPRA registrations, NSQHS Standards accreditation, CPD hours, and adverse events. Continuous compliance for healthcare and allied health providers in Australia.',
  keywords: [
    'healthcare compliance software Australia',
    'AHPRA compliance tracking',
    'NSQHS standards software',
    'clinical governance platform',
    'allied health compliance',
    'healthcare accreditation',
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
  alternates: { canonical: `${siteUrl}/healthcare-compliance` },
  openGraph: {
    title:
      'Healthcare Compliance Software - AHPRA, NSQHS & Clinical Governance | FormaOS',
    description:
      'Track AHPRA registrations, NSQHS Standards accreditation, CPD hours, and adverse events for Australian healthcare providers.',
    url: `${siteUrl}/healthcare-compliance`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Healthcare Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Healthcare Compliance Software - AHPRA, NSQHS & Clinical Governance | FormaOS',
    description:
      'Track AHPRA registrations, NSQHS Standards accreditation, CPD hours, and adverse events for Australian healthcare.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function HealthcareCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'Healthcare Compliance', path: '/healthcare-compliance' },
            ]),
            healthcareServiceSchema,
            healthcareFaqSchema,
          ]),
        }}
      />
      <HealthcareComplianceContent />
    </>
  );
}
