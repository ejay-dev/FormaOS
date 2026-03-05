import { Metadata } from 'next';
import HealthcareContent from './HealthcareContent';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'Healthcare Compliance Management | FormaOS',
  description:
    'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-aligned platform.',
  alternates: { canonical: `${siteUrl}/use-cases/healthcare` },
  openGraph: {
    title: 'Healthcare Compliance Management | FormaOS',
    description:
      'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-aligned platform.',
    type: 'website',
    url: `${siteUrl}/use-cases/healthcare`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare Compliance Management | FormaOS',
    description:
      'Manage policies, evidence, certificates, and incident reporting in one AHPRA-aligned compliance platform.',
  },
};

export default function HealthcareUseCasePage() {
  return <HealthcareContent />;
}
