import type { Metadata } from 'next';
import FeaturesPageContent from './FeaturesPageContent';
import { KeyFacts } from '../components/shared/KeyFacts';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Platform Features - FormaOS',
  description:
    '25 features across framework packs, evidence verification, workflow automation, risk heatmaps, cross-mapping, and the integration marketplace.',
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: 'Platform Features | FormaOS',
    description:
      'Explore 25 core features across compliance operations, workflow automation, identity & security, collaboration, and AI & certification.',
    type: 'website',
    url: `${siteUrl}/features`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Features | FormaOS',
    description:
      'Explore 25 core features across compliance operations, workflow automation, identity & security, collaboration, and AI & certification.',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Features', path: '/features' },
            ])} />
      <KeyFacts
        summary="FormaOS ships 8 framework packs with 252 mapped controls — 102 auto-evaluate against your live data, 150 surface as human attestations. All numbers below trace to lib/compliance/evaluators/register.ts."
        facts={[
          { label: 'Framework packs', value: 'SOC 2 TSC (61), ISO 27001:2022 (93), NIST CSF 2.0 (15), CIS v8 (18), HIPAA (10), GDPR (10), PCI DSS 4.0 (11), NDIS Practice Standards (25)' },
          { label: 'Cross-mapping', value: '40+ pre-loaded control mappings (exact / partial / related) seeded by migration 20260403003' },
          { label: 'Audit chain', value: 'HMAC-chained audit_log + append-only via a DB immutability trigger & RLS deny policies + daily Sigstore Rekor anchor at 05:30 UTC' },
          { label: 'Integrations', value: '6 live (Jira, Slack, Microsoft Teams, Microsoft Entra ID, Google Workspace, custom webhooks). Cloud/scanner/HRIS connectors on roadmap.' },
          { label: 'Identity', value: 'SAML 2.0 SSO + TOTP MFA + scrypt-hashed backup codes + SCIM v2 directory sync' },
          { label: 'AI Q&A', value: 'General-purpose compliance Q&A assistant (stateless). Org-grounded RAG planned, not shipping.' },
          { label: 'API', value: '91 REST endpoints under /api/v1, fos_ prefixed API keys, distributed rate limiting' },
        ]}
      />
      <FeaturesPageContent />
    </>
  );
}
