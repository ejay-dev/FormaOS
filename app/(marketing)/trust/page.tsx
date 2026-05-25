import type { Metadata } from 'next';
import TrustPageContent from './TrustPageContent';
import { TrustProofStaticShell } from './TrustProofStaticShell';
import { KeyFacts } from '../components/shared/KeyFacts';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

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
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Trust Center', path: '/trust' },
            ])} />
      <KeyFacts
        title="Trust Center at a glance"
        summary="The FormaOS Trust Center publishes every artifact a procurement or security review team typically requests — DPA, SLA, sub-processor list, incident response policy, data-handling document, vendor assurance plan, and the bundled vendor trust packet."
        facts={[
          { label: 'Hosting', value: 'AU-hosted (Vercel Sydney + Supabase ap-southeast-2). Customer data does not leave Australia by default.' },
          { label: 'Isolation', value: 'Postgres row-level security (RLS) enforced at the database layer, not just the application' },
          { label: 'Identity', value: 'SAML 2.0 SSO + SCIM 2.0 provisioning on Enterprise; MFA via TOTP with backup codes' },
          { label: 'Encryption', value: 'TLS 1.2+ in transit, AES-256 at rest' },
          { label: 'Audit logs', value: 'Immutable — data access, configuration changes, and user provisioning cannot be deleted' },
          { label: 'Attestations', value: 'SOC 2 Type I in progress (target 2026), ISO 27001 control mapping documented' },
          { label: 'Incident response', value: 'Initial assessment within 4 hours of P1; customer notification within 24 hours of confirmed material incident' },
          { label: 'Data handling', value: 'Standard 30-day deletion on contract termination; DSR workflows built in for GDPR and Privacy Act' },
        ]}
      />
      <TrustPageContent leadContent={<TrustProofStaticShell />} />
    </>
  );
}
