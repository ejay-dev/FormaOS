import type { Metadata } from 'next';
import FAQPageContent from './FAQPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Frequently Asked Questions',
  description:
    'Get answers to common questions about FormaOS, our compliance operating system, security, integrations, pricing, and enterprise support.',
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    title: 'FormaOS | Frequently Asked Questions',
    description:
      'Get answers to common questions about FormaOS, our compliance operating system, security, integrations, pricing, and enterprise support.',
    type: 'website',
    url: `${siteUrl}/faq`,
  },
};

export default function FAQPage() {
  return <FAQPageContent />;
}
