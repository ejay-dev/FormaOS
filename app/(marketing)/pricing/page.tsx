import type { Metadata } from 'next';
import PricingPageContent from './PricingPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Pricing',
  description:
    'Simple, transparent pricing for compliance teams. Start free, scale as you grow.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: 'FormaOS | Pricing',
    description:
      'Transparent pricing for compliance management. Free trial, no setup fees, cancel anytime.',
    type: 'website',
    url: `${siteUrl}/pricing`,
  },
};

export default function PricingPage() {
  return <PricingPageContent />;
}
