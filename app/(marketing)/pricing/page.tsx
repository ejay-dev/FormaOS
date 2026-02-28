import type { Metadata } from 'next';
import PricingPageContent from './PricingPageContent';
import { breadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Pricing — Compliance Management Software | FormaOS',
  description:
    'Simple, transparent pricing for compliance teams. Start with a free 14-day trial, scale as you grow. No setup fees, cancel anytime.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: 'Pricing | FormaOS',
    description:
      'Transparent pricing for compliance management. Free trial, no setup fees, cancel anytime.',
    type: 'website',
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Compliance Management Software | FormaOS',
    description:
      'Transparent pricing for compliance management. Free 14-day trial, no setup fees, cancel anytime.',
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Pricing', path: '/pricing' },
            ])
          ),
        }}
      />
      <PricingPageContent />
    </>
  );
}
