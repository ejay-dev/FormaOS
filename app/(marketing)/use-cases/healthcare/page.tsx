import { Metadata } from 'next';
import HealthcareContent from './HealthcareContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

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
};

export default function HealthcareUseCasePage() {
  return <HealthcareContent />;
}
