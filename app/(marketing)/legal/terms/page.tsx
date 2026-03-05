import type { Metadata } from 'next';
import TermsPageContentSync from './TermsPageContentSync';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'FormaOS | Terms & Conditions',
  description:
    'Terms and conditions for the FormaOS enterprise compliance platform. The framework for responsible platform usage, data integrity, and shared accountability.',
  alternates: {
    canonical: `${siteUrl}/legal/terms`,
  },
  openGraph: {
    title: 'FormaOS | Terms & Conditions',
    description:
      'Terms and conditions for the FormaOS enterprise compliance platform. The framework for responsible platform usage, data integrity, and shared accountability.',
    type: 'website',
    url: `${siteUrl}/legal/terms`,
  },
};

export default function TermsPage() {
  return <TermsPageContentSync />;
}
