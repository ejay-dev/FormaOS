import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const HealthcareContent = dynamic(
  () => import('./HealthcareContent').then((m) => m.default),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Healthcare Compliance Management | FormaOS',
  description:
    'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-aligned platform.',
};

export default function HealthcareUseCasePage() {
  return <HealthcareContent />;
}
