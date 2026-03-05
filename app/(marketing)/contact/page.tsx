import type { Metadata } from 'next';
import { submitMarketingLead } from './actions';
import ContactPageContentNew from './ContactPageContentNew';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'Request a Demo — Compliance Operating System | FormaOS',
  description:
    'Request a personalized demo or get in touch with the FormaOS team. See how FormaOS works for your regulated industry.',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'Request a Demo | FormaOS',
    description:
      'Request a personalized demo or get in touch with the FormaOS team.',
    type: 'website',
    url: `${siteUrl}/contact`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact FormaOS — Request a Demo',
    description:
      'Request a personalized demo or get in touch with the FormaOS team.',
  },
};

export default function ContactPage() {
  return <ContactPageContentNew submitAction={submitMarketingLead} />;
}
