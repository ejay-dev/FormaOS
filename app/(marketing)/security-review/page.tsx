import type { Metadata } from 'next';
import SecurityReviewContent from './SecurityReviewContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Security Review Packet',
  description:
    'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
  alternates: {
    canonical: `${siteUrl}/security-review`,
  },
  openGraph: {
    title: 'FormaOS | Security Review Packet',
    description:
      'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
    type: 'website',
    url: `${siteUrl}/security-review`,
  },
};

export default function SecurityReviewPage() {
  return <SecurityReviewContent />;
}
