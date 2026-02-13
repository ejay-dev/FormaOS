import { Metadata } from 'next';
import NDISContent from './NDISContent';

export const metadata: Metadata = {
  title: 'NDIS & Aged Care Compliance | FormaOS',
  description:
    'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and audit readiness.',
};

export default function NDISUseCasePage() {
  return <NDISContent />;
}
