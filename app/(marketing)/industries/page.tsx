import type { Metadata } from 'next';
import IndustriesPageContent from './IndustriesPageContentNew';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'Compliance Infrastructure Across Australian Regulated Industries | FormaOS',
  description:
    'Pre-built compliance frameworks for NDIS, Healthcare, Financial Services, Education and Childcare, and Construction. Australian regulatory standards built in.',
  keywords: [
    'compliance software industries Australia',
    'NDIS compliance software',
    'healthcare compliance platform',
    'ASIC compliance tool',
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
    canonical: `${siteUrl}/industries`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/industries`,
    siteName: 'FormaOS',
    title:
      'Compliance Infrastructure Across Australian Regulated Industries | FormaOS',
    description:
      'Pre-built compliance frameworks for NDIS, Healthcare, Financial Services, Education and Childcare, and Construction.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS Industry Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Compliance Infrastructure Across Australian Regulated Industries | FormaOS',
    description:
      'Pre-built compliance frameworks for NDIS, Healthcare, Financial Services, Education and Childcare, and Construction.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
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
            ]),
          ),
        }}
      />
      <IndustriesPageContent />
    </>
  );
}
