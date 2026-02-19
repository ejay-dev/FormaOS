import type { Metadata } from 'next';
import SecurityPageContent from './SecurityPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Security & Compliance',
  description:
    'Enterprise-grade security infrastructure with privacy by design for regulated data.',
  alternates: {
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    title: 'FormaOS | Security & Compliance',
    description:
      'Enterprise-grade security controls and privacy protection for regulated data.',
    type: 'website',
    url: `${siteUrl}/security`,
  },
};

export default function SecurityPage() {
  return <SecurityPageContent />;
}
