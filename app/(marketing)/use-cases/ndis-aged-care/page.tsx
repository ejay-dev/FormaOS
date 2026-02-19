import { Metadata } from 'next';
import NDISContent from './NDISContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'NDIS & Aged Care Compliance | FormaOS',
  description:
    'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and audit readiness.',
  alternates: { canonical: `${siteUrl}/use-cases/ndis-aged-care` },
  openGraph: {
    title: 'NDIS & Aged Care Compliance | FormaOS',
    description:
      'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and audit readiness.',
    type: 'website',
    url: `${siteUrl}/use-cases/ndis-aged-care`,
  },
};

export default function NDISUseCasePage() {
  return <NDISContent />;
}
