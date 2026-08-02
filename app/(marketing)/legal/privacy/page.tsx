import type { Metadata } from 'next';
import PrivacyPageContentSync from './PrivacyPageContentSync';

const PRIVACY_CANONICAL_URL = 'https://www.formaos.com.au/legal/privacy';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Privacy Policy',
  description:
    'How FormaOS collects, uses, stores, and discloses personal information, written to the Australian Privacy Principles and, where it applies, the GDPR.',
  alternates: {
    canonical: PRIVACY_CANONICAL_URL,
  },
  openGraph: {
    title: 'FormaOS | Privacy Policy',
    description:
      'How FormaOS collects, uses, stores, and discloses personal information, written to the Australian Privacy Principles and, where it applies, the GDPR.',
    type: 'website',
    url: PRIVACY_CANONICAL_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Privacy Policy',
    description:
      'How FormaOS collects, uses, stores, and discloses personal information, written to the Australian Privacy Principles and, where it applies, the GDPR.',
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContentSync />;
}
