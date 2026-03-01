import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Drata',
  description:
    'FormaOS vs Drata: operational workflow governance with evidence verification and audit-ready execution.',
  alternates: {
    canonical: `${siteUrl}/compare/drata`,
  },
  openGraph: {
    title: 'FormaOS | Compare: Drata',
    description:
      'FormaOS vs Drata: operational workflow governance with evidence verification and audit-ready execution.',
    type: 'website',
    url: `${siteUrl}/compare/drata`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Drata — Compare Compliance Platforms',
    description:
      'FormaOS vs Drata: operational workflow governance with evidence verification and audit-ready execution.',
  },
};

const points = [
  {
    title: 'Continuous posture through operations',
    detail:
      'FormaOS keeps posture current by tying control status to tasks, ownership, and evidence verification workflows — not just automated integrations.',
  },
  {
    title: 'Defensible audit history',
    detail:
      'FormaOS emphasizes chain-of-custody context and immutable audit logs so reviewers can trace what happened, who approved it, and when — for every control.',
  },
  {
    title: 'Outcome-centric execution model',
    detail:
      'FormaOS is designed around "prove readiness" workflows, not page-centric compliance management. Every control maps to owned work and timestamped evidence.',
  },
  {
    title: 'Non-security regulated sectors',
    detail:
      'FormaOS extends beyond security compliance to healthcare, NDIS, aged care, and financial services — governed by AHPRA, NSQHS, RACGP, and Privacy Act obligations.',
  },
  {
    title: 'Named accountability at every level',
    detail:
      'Every control and evidence item has a named owner. Workflow escalations, SLA acknowledgements, and approval histories are all recorded — never assumed.',
  },
  {
    title: 'Enterprise procurement artifacts included',
    detail:
      'FormaOS ships with DPA, vendor assurance questionnaire, SAML 2.0 SSO, MFA enforcement, and data residency controls (AU/US/EU) — accelerating enterprise procurement.',
  },
] as const;

const idealIf = [
  'You need accountability across frontline operators and managers — not just automated security scans',
  'Auditors require defensible, contextual evidence with approvals and full ownership history',
  'You want a single operating view of compliance execution across all active frameworks',
  'Your regulated environment includes healthcare, NDIS, care services, or non-security obligations',
  'You need evidence verification and chain-of-custody — not just evidence collection and storage',
  'Your enterprise procurement team requires SAML SSO, DPA, and data residency assurance',
] as const;

const featureComparison = [
  { feature: 'Operational workflow enforcement', formaos: 'yes', competitor: 'no' },
  { feature: 'Named control ownership with audit trail', formaos: 'yes', competitor: 'partial' },
  { feature: 'Evidence verification with approval chain', formaos: 'yes', competitor: 'partial' },
  { feature: 'Immutable, tamper-evident audit logs', formaos: 'yes', competitor: 'yes' },
  { feature: 'Healthcare compliance (AHPRA, NSQHS, RACGP)', formaos: 'yes', competitor: 'no' },
  { feature: 'NDIS Practice Standards (all 8 modules)', formaos: 'yes', competitor: 'no' },
  { feature: 'Incident management with corrective actions', formaos: 'yes', competitor: 'partial' },
  { feature: 'Credential / workforce governance', formaos: 'yes', competitor: 'no' },
  { feature: 'AU-first data residency (AU/US/EU)', formaos: 'yes', competitor: 'US-first, AU on request' },
  { feature: 'SAML 2.0 SSO (Okta, Azure AD, Google)', formaos: 'Enterprise plan', competitor: 'Enterprise plan' },
  { feature: 'SCIM user provisioning', formaos: 'yes', competitor: 'yes' },
  { feature: 'Pre-built frameworks', formaos: '9 frameworks', competitor: '14+ frameworks' },
  { feature: 'Continuous compliance scoring', formaos: 'yes', competitor: 'yes' },
  { feature: 'DPA and vendor assurance packet', formaos: 'Included', competitor: 'On request' },
] as const;

const competitorStrengths = [
  'Your compliance program is primarily SOC 2, ISO 27001, or HIPAA — and you need deep automation for cloud infrastructure monitoring and evidence collection from 75+ native integrations',
  'You operate in technology/SaaS and your compliance team is focused on security frameworks rather than operational or regulated-sector governance',
  'You want an established vendor with a large integration marketplace and a broad network of auditor partnerships',
] as const;

const procurementChecks = [
  {
    title: 'Security review packet',
    detail:
      'Architecture, identity governance, AES-256 encryption, penetration testing, and SOC 2-aligned controls documented before your security team asks the first question.',
  },
  {
    title: 'DPA and vendor assurance',
    detail:
      'Data processing agreement, vendor assurance questionnaire, and SLA documentation available for legal, risk, and procurement sign-off — no delays.',
  },
  {
    title: 'Enterprise identity controls',
    detail:
      'SAML 2.0 SSO (Okta, Azure AD, Google Workspace), SCIM provisioning, and MFA policy enforcement ready for enterprise identity requirements.',
  },
] as const;

export default function CompareDrataPage() {
  return (
    <ComparePageTemplate
      competitor="Drata"
      heroDescription="Drata helps security teams monitor compliance posture. FormaOS is built to run compliance as a governed operating system — linking controls to execution workflows, named ownership, and defensible evidence across every regulated sector."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      featureComparison={featureComparison}
      competitorStrengths={competitorStrengths}
      source="compare_drata"
    />
  );
}
