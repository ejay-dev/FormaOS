import type { Metadata } from 'next';
import HealthcareComplianceContent from './HealthcareComplianceContent';
import { breadcrumbSchema, faqSchema, siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'Healthcare Compliance Platform - Clinical Governance & Accreditation | FormaOS',
  description:
    'Healthcare compliance platform for hospitals, clinics, and care providers. Manage NSQHS Standards, AHPRA requirements, clinical governance, incident reporting, and accreditation readiness in one system.',
  alternates: { canonical: `${siteUrl}/healthcare-compliance-platform` },
  openGraph: {
    title: 'Healthcare Compliance Platform | FormaOS',
    description:
      'Manage NSQHS Standards, clinical governance, and accreditation readiness for healthcare organizations.',
    type: 'website',
    url: `${siteUrl}/healthcare-compliance-platform`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare Compliance Platform | FormaOS',
    description:
      'Manage NSQHS Standards, clinical governance, and accreditation readiness for healthcare organizations.',
  },
};

const pageFaq = [
  {
    question: 'Does FormaOS support NSQHS Standards?',
    answer:
      'Yes. FormaOS maps to the National Safety and Quality Health Service Standards, including all eight standards covering clinical governance, partnering with consumers, medication safety, comprehensive care, and more.',
  },
  {
    question: 'Can FormaOS manage AHPRA compliance requirements?',
    answer:
      'FormaOS tracks practitioner registration, credential currency, and continuing professional development requirements aligned with AHPRA regulatory obligations.',
  },
  {
    question: 'How does FormaOS handle clinical incident reporting?',
    answer:
      'FormaOS provides structured incident management workflows with severity classification, investigation management, root cause analysis, and corrective action tracking aligned with clinical governance requirements.',
  },
  {
    question: 'Is FormaOS suitable for multi-site healthcare organizations?',
    answer:
      'Yes. FormaOS supports multi-site deployments with centralized governance and site-specific operational workflows, allowing standardized compliance management across locations.',
  },
];

export default function HealthcareCompliancePlatformPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              {
                name: 'Healthcare Compliance Platform',
                path: '/healthcare-compliance-platform',
              },
            ]),
          ]),
        }}
      />
      <HealthcareComplianceContent />
    </>
  );
}
