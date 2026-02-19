import type { Metadata } from 'next';
import TrustPageContent from './TrustPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Trust Center',
  description:
    'Customer-facing assurance portal for compliance posture, security controls, and audit readiness artifacts.',
  alternates: { canonical: `${siteUrl}/trust` },
  openGraph: {
    title: 'FormaOS | Trust Center',
    description:
      'Customer-facing assurance portal for compliance posture, security controls, and audit readiness artifacts.',
    type: 'website',
    url: `${siteUrl}/trust`,
  },
};

export default function TrustCenterPage() {
  return <TrustPageContent />;
}
