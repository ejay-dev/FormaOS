import type { Metadata } from 'next';
import PrivacyPageContentSync from './PrivacyPageContentSync';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Privacy Policy',
  description:
    'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational information in regulated industries.',
  alternates: {
    canonical: `${siteUrl}/legal/privacy`,
  },
  openGraph: {
    title: 'FormaOS | Privacy Policy',
    description:
      'Privacy policy for the FormaOS enterprise compliance platform. We are committed to protecting your personal and organizational information in regulated industries.',
    type: 'website',
    url: `${siteUrl}/legal/privacy`,
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContentSync />;
}
