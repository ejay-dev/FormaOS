import type { Metadata } from 'next';
import PrivacyPageContentSync from './PrivacyPageContentSync';

const PRIVACY_CANONICAL_URL = 'https://www.formaos.com.au/legal/privacy';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Privacy Policy',
  description:
    'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational information in regulated industries.',
  alternates: {
    canonical: PRIVACY_CANONICAL_URL,
  },
  openGraph: {
    title: 'FormaOS | Privacy Policy',
    description:
      'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational information in regulated industries.',
    type: 'website',
    url: PRIVACY_CANONICAL_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Privacy Policy',
    description:
      'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational information in regulated industries.',
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContentSync />;
}
