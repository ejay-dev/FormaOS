import type { Metadata } from 'next';
import CustomerStoriesContent from './CustomerStoriesContent';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'Customer Stories - Compliance Operations in Practice | FormaOS',
  description:
    'See how regulated operators use FormaOS to govern controls, evidence, and audit readiness in healthcare, NDIS, aged care, and financial services.',
  alternates: {
    canonical: `${siteUrl}/customer-stories`,
  },
  openGraph: {
    title: 'Customer Stories | FormaOS',
    description:
      'See how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
    type: 'website',
    url: `${siteUrl}/customer-stories`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Stories - Compliance Operations in Practice | FormaOS',
    description:
      'See how regulated operators use FormaOS to govern controls, evidence, and audit readiness in regulated industries.',
  },
};

export default function CustomerStoriesPage() {
  return <CustomerStoriesContent />;
}
