import type { Metadata } from 'next';
import IndustriesPageContent from './IndustriesPageContentNew';
import { breadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Industry Compliance Solutions — Healthcare, NDIS, Aged Care | FormaOS',
  description:
    'Pre-built compliance frameworks for NDIS, healthcare, aged care, disability services, financial services, and government. Purpose-built for regulated industries.',
  alternates: {
    canonical: `${siteUrl}/industries`,
  },
  openGraph: {
    title: 'Industry Solutions | FormaOS',
    description:
      'Pre-built compliance frameworks for NDIS, healthcare, aged care, and regulated industries.',
    type: 'website',
    url: `${siteUrl}/industries`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Industry Compliance Solutions — Healthcare, NDIS, Aged Care | FormaOS',
    description:
      'Purpose-built compliance for NDIS, healthcare, aged care, financial services, and government regulated industries.',
  },
};

export default function IndustriesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
            ])
          ),
        }}
      />
      <IndustriesPageContent />
    </>
  );
}
