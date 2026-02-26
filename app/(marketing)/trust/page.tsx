import type { Metadata } from 'next';
import TrustPageContent from './TrustPageContent';
import { breadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Trust Center — Security & Compliance Assurance | FormaOS',
  description:
    'Review FormaOS security posture, compliance controls, data handling policies, and audit readiness artifacts. Enterprise trust documentation in one portal.',
  alternates: { canonical: `${siteUrl}/trust` },
  openGraph: {
    title: 'Trust Center | FormaOS',
    description:
      'Security posture, compliance controls, and audit readiness artifacts for enterprise procurement.',
    type: 'website',
    url: `${siteUrl}/trust`,
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
            ])
          ),
        }}
      />
      <TrustPageContent />
    </>
  );
}
