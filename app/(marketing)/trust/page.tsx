import type { Metadata } from 'next';
import TrustPageContent from './TrustPageContent';
import { TrustProofStaticShell } from './TrustProofStaticShell';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Trust & Compliance | FormaOS',
  description:
    'Transparent trust documentation for FormaOS. Data handling, DPA, SLA, subprocessors, incident response, and vendor assurance information.',
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
  alternates: { canonical: `${siteUrl}/trust` },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/trust`,
    siteName: 'FormaOS',
    title: 'Trust & Compliance | FormaOS',
    description:
      'Transparent trust documentation for FormaOS. Data handling, DPA, SLA, subprocessors, incident response, and vendor assurance.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS Trust Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trust & Compliance | FormaOS',
    description:
      'Transparent trust documentation for FormaOS. Data handling, DPA, SLA, subprocessors, incident response.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function TrustCenterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Trust Center', path: '/trust' },
            ]),
          ),
        }}
      />
      <TrustPageContent leadContent={<TrustProofStaticShell />} />
    </>
  );
}
