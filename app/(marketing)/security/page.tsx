import type { Metadata } from 'next';
import SecurityPageContent from './SecurityPageContent';
import { KeyFacts } from '../components/shared/KeyFacts';
import { faqSchema, breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Security & Data Protection | FormaOS',
  description:
    'Enterprise-grade security for Australian compliance data. AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA, data residency assured.',
  keywords: [
    'FormaOS security',
    'compliance software security Australia',
    'data residency Australia',
    'SOC 2 compliance software',
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
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/security`,
    siteName: 'FormaOS',
    title: 'Security & Data Protection | FormaOS',
    description:
      'Enterprise-grade security for Australian compliance data. AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS Security & Data Protection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security & Data Protection | FormaOS',
    description:
      'Enterprise-grade security for Australian compliance data. AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

const securityFaqItems = [
  {
    question: 'How does FormaOS ensure audit integrity?',
    answer:
      'Every action in FormaOS is automatically logged with full context - who did what, when, and in relation to which control or workflow. Audit trails are immutable and timestamped, providing a complete chain of evidence.',
  },
  {
    question: 'How is evidence made immutable?',
    answer:
      'Evidence records are tracked with audit logs and timestamps. Every upload, update, and approval is recorded for full traceability, creating a defensible chain of evidence.',
  },
  {
    question: 'Does FormaOS support ISO and SOC frameworks?',
    answer:
      'Yes. FormaOS is framework-agnostic and supports ISO 27001, SOC 2, NDIS Practice Standards, healthcare regulations, and other frameworks simultaneously.',
  },
  {
    question: 'Is FormaOS multi-tenant secure?',
    answer:
      'FormaOS implements enterprise-grade security with data encryption in transit and at rest, role-based access controls, SSO support, and isolated tenant environments.',
  },
];

export default function SecurityPage() {
  return (
    <>
      <JsonLd data={[
            faqSchema(securityFaqItems),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Security', path: '/security' },
            ]),
          ]} />
      <KeyFacts
        summary="FormaOS security posture is grounded in real cryptographic and database-level controls — not just marketing claims. Every fact below traces to a named file in the codebase."
        facts={[
          { label: 'Hosting', value: 'Vercel Sydney + Supabase ap-southeast-2 (AU). Data does not leave Australia by default.' },
          { label: 'Audit chain', value: 'HMAC-SHA256 row-chained audit_log; chain top anchors daily at 05:30 UTC to Sigstore Rekor (Linux Foundation transparency log).' },
          { label: 'Mutation defence', value: 'Append-only enforced at the Postgres layer via restrictive RLS policies — not in application code. Platform admins cannot mutate audit rows.' },
          { label: 'Identity', value: 'SAML 2.0 SSO ships pre-wired for Microsoft Entra ID and Google Workspace on Enterprise. TOTP MFA + scrypt-hashed backup codes on all plans. SCIM v2 directory sync available.' },
          { label: 'Encryption', value: 'AES-256-GCM for integration secrets and TOTP material; TLS 1.3 in transit; secrets rotated on a documented cadence per /docs/operations/secret-rotation-runbook.md.' },
          { label: 'Multi-tenant isolation', value: '450+ Postgres RLS policies across 30+ tables. Every data query filters on org_members → organization_id at the database, not the API layer.' },
          { label: 'SOC 2 status', value: 'Type I in progress (target 2026); evidence pack assembled inside FormaOS itself.' },
        ]}
      />
      <SecurityPageContent />
    </>
  );
}
