import type { Metadata } from 'next';
import CustomerStoriesContent from './CustomerStoriesContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Use Case Scenarios',
  description:
    'Example scenarios showing how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
  alternates: {
    canonical: `${siteUrl}/customer-stories`,
  },
  openGraph: {
    title: 'FormaOS | Use Case Scenarios',
    description:
      'Example scenarios showing how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
    type: 'website',
    url: `${siteUrl}/customer-stories`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Use Cases | FormaOS',
    description:
      'See how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
  },
};

export default function CustomerStoriesPage() {
  return <CustomerStoriesContent />;
}
