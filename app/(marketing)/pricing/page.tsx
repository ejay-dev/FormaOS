import type { Metadata } from 'next';
import PricingPageContent from './PricingPageContent';
import { KeyFacts } from '../components/shared/KeyFacts';
import { PRICING_FAQS } from './components/faq-data';
import { faqSchema, pricingSchema } from '@/lib/seo';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'Compliance OS Pricing - Foundation to Enterprise | FormaOS',
  description:
    'Foundation, Growth, Scale and Enterprise plans for compliance teams. Transparent pricing for NDIS, healthcare, finance, childcare, and construction.',
  keywords: [
    'NDIS compliance software pricing',
    'aged care compliance platform Australia',
    'FormaOS pricing',
    'compliance OS cost',
    'NDIS Practice Standards software',
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
    title:
      'Compliance OS Pricing - Foundation to Enterprise | FormaOS',
    description:
      'Self-serve compliance infrastructure for NDIS, aged care, and healthcare. Foundation $297/mo, Growth $797/mo, Scale $1,800/mo, Enterprise custom.',
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
    title:
      'Compliance OS Pricing - Foundation to Enterprise | FormaOS',
    description:
      'NDIS and aged care compliance, priced for the work it removes. Foundation $297, Growth $797, Scale $1,800, Enterprise custom.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={[
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
          ]} />
      <KeyFacts
        summary="FormaOS pricing covers four plans for regulated Australian organisations — Foundation through Enterprise. Pricing in AUD, GST applicable. Every plan unlocks the same 8 framework packs and 252 mapped controls."
        facts={[
          { label: 'Plans', value: 'Foundation · Growth · Scale · Enterprise' },
          { label: 'Pricing model', value: 'Per-seat monthly. AUD pricing. GST applicable.' },
          { label: 'Foundation', value: 'From AUD $297/month — single-site, one framework focus, all 252 controls available' },
          { label: 'Growth', value: 'From AUD $797/month — multi-site, multi-framework cross-mapping, automation triggers' },
          { label: 'Scale', value: 'From AUD $1,800/month — directory sync, advanced governance, expanded API quota' },
          { label: 'Enterprise', value: 'From AUD $5,000/month — SAML 2.0 SSO, AU-managed deployment, dedicated security review, vendor assurance materials' },
          { label: 'Trial', value: 'Guided assessment — not self-serve free tier (compliance setup needs scoping)' },
          { label: 'Hosting', value: 'AU-hosted by default (Vercel Sydney + Supabase ap-southeast-2)' },
        ]}
      />
      <PricingPageContent />
    </>
  );
}
