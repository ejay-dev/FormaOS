import type { Metadata } from 'next';
import NDISProvidersContent from './NDISProvidersContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'NDIS Compliance Software Australia | FormaOS',
  description:
    'Audit-ready NDIS compliance software. Pre-built NDIS Practice Standards, worker screening tracking, SIRS notification workflows, and one-click evidence packs for unannounced audits.',
  keywords: [
    'NDIS compliance software',
    'NDIS practice standards',
    'NDIS audit ready',
    'NDIS worker screening',
    'SIRS notification',
    'NDIS Commission',
    'disability compliance software',
    'NDIS evidence management',
  ],
  alternates: { canonical: `${siteUrl}/ndis-providers` },
  openGraph: {
    title: 'NDIS Compliance Software for Australian Providers | FormaOS',
    description:
      'Pre-built NDIS Practice Standards, automated worker screening alerts, and audit-ready evidence packs. Built for NDIS registered providers.',
    url: 'https://formaos.com.au/ndis-providers',
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function NDISProvidersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'NDIS Providers', path: '/ndis-providers' },
            ])
          ),
        }}
      />
      <NDISProvidersContent />
    </>
  );
}
