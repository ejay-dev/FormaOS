import type { Metadata } from 'next';
import SecurityReviewContent from './SecurityReviewContent';
import { breadcrumbSchema, howToSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Security Review Packet',
  description:
    'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
  alternates: {
    canonical: `${siteUrl}/security-review`,
  },
  openGraph: {
    title: 'FormaOS | Security Review Packet',
    description:
      'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
    type: 'website',
    url: `${siteUrl}/security-review`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Security Review Packet',
    description:
      'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
  },
};

// HowTo schema for the security review walkthrough. Mirrors the
// human-facing 12-step checklist in SecurityReviewContent — AI answer
// engines treat HowTo as an authoritative ordered procedure and cite
// individual steps when users ask procedural questions ("how do I run a
// security review on FormaOS").
const SECURITY_REVIEW_HOWTO = howToSchema({
  name: 'How to run a procurement-ready security review of FormaOS',
  description:
    'A 12-step security review walkthrough for enterprise buyers and procurement teams evaluating FormaOS — covers architecture, data handling, identity, encryption, audit logging, and operational assurance.',
  url: `${siteUrl}/security-review`,
  totalTime: 'PT45M',
  steps: [
    {
      name: 'Confirm hosting region and data residency',
      text: 'Verify FormaOS is hosted in AU (Vercel Sydney + Supabase ap-southeast-2). Customer data does not leave Australia by default.',
    },
    {
      name: 'Review the multi-tenant isolation model',
      text: 'Confirm Postgres row-level security (RLS) is enforced at the database layer, not just the application. Request the RLS policy summary.',
    },
    {
      name: 'Validate identity and access controls',
      text: 'Review supported identity providers (email + password, Google OAuth, Microsoft, SAML 2.0 SSO), MFA enforcement (TOTP + backup codes), and SCIM 2.0 provisioning availability.',
    },
    {
      name: 'Verify encryption in transit and at rest',
      text: 'TLS 1.2+ in transit, AES-256 at rest for database and storage. Confirm certificate rotation cadence and key management.',
    },
    {
      name: 'Examine audit logging immutability',
      text: 'Audit logs for data access, configuration changes, and user provisioning are immutable. Confirm export format and retention.',
    },
    {
      name: 'Review the Data Processing Agreement (DPA)',
      text: 'GDPR Article 28 and Australian Privacy Act-aligned. Verify Schedule 1 (sub-processors) and Schedule 3 (deletion timelines).',
    },
    {
      name: 'Check the sub-processor list and notification policy',
      text: 'Read the current sub-processors document. Confirm advance notification before any new sub-processor is engaged for production data.',
    },
    {
      name: 'Validate incident response procedures',
      text: 'Initial assessment within 4 hours of P1 detection, customer notification within 24 hours of confirmed material incident. Request the full incident response policy.',
    },
    {
      name: 'Confirm certification and attestation status',
      text: 'SOC 2 Type I in progress (target 2026). Review ISO 27001 control structure mapping. Request the current security baseline audit summary.',
    },
    {
      name: 'Review the vendor trust packet',
      text: 'Bundled procurement document covering architecture, encryption, identity governance, data handling, and assurance review.',
    },
    {
      name: 'Examine vendor assurance plan',
      text: 'Independent security assessment plan and assurance artifact request process.',
    },
    {
      name: 'Complete the procurement FAQ checklist',
      text: 'Architecture, hosting, identity, encryption, and audit posture answered for enterprise buyers. Use as the basis for your security questionnaire.',
    },
  ],
});

const BREADCRUMB = breadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Security Review Packet', path: '/security-review' },
]);

export default function SecurityReviewPage() {
  return (
    <>
      <JsonLd data={[SECURITY_REVIEW_HOWTO, BREADCRUMB]} />
      <SecurityReviewContent />
    </>
  );
}
