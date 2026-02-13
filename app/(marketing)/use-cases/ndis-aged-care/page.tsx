import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const NDISContent = dynamic(
  () => import('./NDISContent').then((m) => m.default),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'NDIS & Aged Care Compliance | FormaOS',
  description:
    'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and audit readiness.',
};

export default function NDISUseCasePage() {
  return <NDISContent />;
}
