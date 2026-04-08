import type { Metadata } from 'next';
import HealthcareComplianceContent from './HealthcareComplianceContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Healthcare Compliance Software Australia | FormaOS',
  description:
    'AHPRA credential tracking, NSQHS standards mapping, and audit-ready evidence for Australian healthcare organisations. Pre-built frameworks for accreditation visits.',
  keywords: [
    'AHPRA compliance tracking',
    'NSQHS standards software',
    'healthcare compliance AU',
    'AHPRA registration',
    'clinical governance software',
    'healthcare accreditation',
  ],
  alternates: { canonical: `${siteUrl}/healthcare-compliance` },
  openGraph: {
    title: 'Healthcare Compliance Software Australia | FormaOS',
    description:
      'AHPRA credential tracking, NSQHS standards mapping, and audit-ready evidence packs for healthcare organisations.',
    url: 'https://formaos.com.au/healthcare-compliance',
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function HealthcareCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'Healthcare Compliance', path: '/healthcare-compliance' },
            ])
          ),
        }}
      />
      <HealthcareComplianceContent />
    </>
  );
}
