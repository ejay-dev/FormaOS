import type { Metadata } from 'next';
import SecurityReviewContent from './SecurityReviewContent';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
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
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Security Review Packet',
    description:
      'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
  },
};

export default function SecurityReviewPage() {
  return <SecurityReviewContent />;
}
