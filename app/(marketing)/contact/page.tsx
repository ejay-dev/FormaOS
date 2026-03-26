import type { Metadata } from 'next';
import { submitMarketingLead } from './actions';
import ContactPageContentNew from './ContactPageContentNew';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'Talk to Sales | Pricing, Procurement, and Enterprise Review | FormaOS',
  description:
    'Talk to FormaOS about plan fit, enterprise evaluation, procurement review, and rollout for regulated teams.',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'Talk to Sales | FormaOS',
    description:
      'Talk to FormaOS about plan fit, enterprise evaluation, procurement review, and rollout.',
    type: 'website',
    url: `${siteUrl}/contact`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talk to Sales | Pricing, Procurement, and Enterprise Review',
    description:
      'Talk to FormaOS about plan fit, enterprise evaluation, procurement review, and rollout.',
  },
};

export default function ContactPage() {
  return <ContactPageContentNew submitAction={submitMarketingLead} />;
}
