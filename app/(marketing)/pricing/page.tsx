import type { Metadata } from 'next';
import PricingPageContent from './PricingPageContent';
import { PRICING_FAQS } from './components/faq-data';
import { faqSchema, pricingSchema } from '@/lib/seo';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Pricing - FormaOS Compliance Platform | From $159/mo',
  description:
    'Transparent compliance platform pricing. Starter $159/mo, Professional $239/mo, Enterprise $399/mo. 14-day free trial, AU-hosted, no credit card required.',
  keywords: [
    'compliance software pricing Australia',
    'FormaOS pricing',
    'compliance platform cost',
  ],
  authors: [{ name: 'FormaOS' }],
  creator: 'FormaOS',
  publisher: 'FormaOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/pricing`,
    siteName: 'FormaOS',
    title: 'Pricing - FormaOS Compliance Platform | From $159/mo',
    description:
      'Transparent compliance platform pricing. Starter $159/mo, Professional $239/mo, Enterprise $399/mo. 14-day free trial, AU-hosted.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - FormaOS Compliance Platform | From $159/mo',
    description:
      'Transparent compliance platform pricing. Starter $159/mo, Professional $239/mo, Enterprise $399/mo. 14-day free trial.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(
              PRICING_FAQS.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
              })),
            ),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Pricing', path: '/pricing' },
            ]),
            pricingSchema(),
          ]),
        }}
      />
      <PricingPageContent />
    </>
  );
}
