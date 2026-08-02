import type { Metadata } from 'next';
import TermsPageContentSync from './TermsPageContentSync';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Terms & Conditions',
  description:
    'Terms and conditions for the FormaOS compliance platform: acceptable use, data ownership, security, availability, fees, liability, and governing law.',
  alternates: {
    canonical: `${siteUrl}/legal/terms`,
  },
  openGraph: {
    title: 'FormaOS | Terms & Conditions',
    description:
      'Terms and conditions for the FormaOS compliance platform: acceptable use, data ownership, security, availability, fees, liability, and governing law.',
    type: 'website',
    url: `${siteUrl}/legal/terms`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Terms & Conditions',
    description:
      'Terms and conditions for the FormaOS compliance platform: acceptable use, data ownership, security, availability, fees, liability, and governing law.',
  },
};

export default function TermsPage() {
  return <TermsPageContentSync />;
}
