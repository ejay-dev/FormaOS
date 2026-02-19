import type { Metadata } from 'next';
import IndustriesPageContent from './IndustriesPageContentNew';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Industry Solutions',
  description:
    'Compliance frameworks for health, disability, community services, and regulated industries.',
  alternates: {
    canonical: `${siteUrl}/industries`,
  },
  openGraph: {
    title: 'FormaOS | Industry Solutions',
    description:
      'Pre-built compliance frameworks for NDIS, healthcare, and community services.',
    type: 'website',
    url: `${siteUrl}/industries`,
  },
};

export default function IndustriesPage() {
  return <IndustriesPageContent />;
}
