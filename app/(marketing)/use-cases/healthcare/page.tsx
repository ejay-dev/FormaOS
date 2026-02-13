import { Metadata } from 'next';
import HealthcareContent from './HealthcareContent';

export const metadata: Metadata = {
  title: 'Healthcare Compliance Management | FormaOS',
  description:
    'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-aligned platform.',
};

export default function HealthcareUseCasePage() {
  return <HealthcareContent />;
}
