import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import { brand } from '@/config/brand';
import {
  siteUrl,
  breadcrumbSchema,
  softwareApplicationSchema,
} from '@/lib/seo';
export const metadata: Metadata = {
  title: 'FormaOS | Compare: Vanta',
  description:
    'FormaOS vs Vanta: operational compliance execution with defensible evidence workflows and audit-ready governance.',
  alternates: {
    canonical: `${siteUrl}/compare/vanta`,
  },
  openGraph: {
    title: 'FormaOS | Compare: Vanta',
    description:
      'FormaOS vs Vanta: operational compliance execution with defensible evidence workflows and audit-ready governance.',
    type: 'website',
    url: `${siteUrl}/compare/vanta`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Vanta - Compare Compliance Platforms',
    description:
      'FormaOS vs Vanta: operational compliance execution with defensible evidence workflows and audit-ready governance.',
  },
};

const points = [
  {
    title: 'Execution-first operating system',
    detail:
      'FormaOS is designed to run compliance as work: controls become tasks, owners, deadlines, and evidence requirements - not just monitoring rules and scanning alerts.',
  },
  {
    title: 'Evidence defensibility workflows',
    detail:
      'Verification status, audit history, and chain-of-custody context reduce reviewer ambiguity and improve audit response time - every control, timestamped and traceable.',
  },
  {
    title: 'Built for regulated operators',
    detail:
      'Beyond security teams: FormaOS supports operational compliance patterns across healthcare, disability services, aged care, and multi-site environments where regulators audit operations.',
  },
  {
    title: 'Data sovereignty by default',
    detail:
      'FormaOS is AU-hosted by default. Additional residency requirements, DPA details, and data-handling posture are reviewed explicitly during enterprise evaluation.',
  },
  {
    title: 'Incident management with audit trail',
    detail:
      'Structured incident intake, investigation, corrective action, and closure - with full accountability chain and regulator-ready evidence export built into the workflow.',
  },
  {
    title: 'Named ownership - never assumed',
    detail:
      'Every control, evidence item, and action has a named owner with timestamped history. Regulators can trace exactly who did what, when, and with what authority.',
  },
] as const;

const idealIf = [
  'You need workflows that enforce accountability across operational teams - not just security automation',
  'Evidence should be verified and defensible with approval history - not only collected and organized',
  'You want posture reporting that maps to operational reality and regulator expectations',
  'Your organization operates in healthcare, NDIS, disability, aged care, or financial services',
  'Data residency and sovereignty are non-negotiable requirements for your enterprise',
  'You need incident management linked to compliance evidence - not a separate disconnected workflow',
] as const;

const featureComparison = [
  {
    feature: 'Operational workflow enforcement',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Named control ownership with audit trail',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Evidence verification with approval chain',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Immutable, tamper-evident audit logs',
    formaos: 'yes',
    competitor: 'yes',
  },
  {
    feature: 'Healthcare compliance (AHPRA, NSQHS, RACGP)',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'NDIS Practice Standards (all 8 modules)',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Incident management with corrective actions',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Credential / workforce governance',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'AU-first data residency',
    formaos: 'AU-hosted by default',
    competitor: 'US-first, limited AU',
  },
  {
    feature: 'SAML 2.0 SSO (Okta, Azure AD, Google)',
    formaos: 'Enterprise plan',
    competitor: 'Business plan+',
  },
  {
    feature: 'SCIM user provisioning',
    formaos: 'Reviewed during procurement',
    competitor: 'yes',
  },
  {
    feature: 'Pre-built frameworks',
    formaos: `${brand.frameworks.count} frameworks`,
    competitor: '20+ frameworks',
  },
  {
    feature: 'Continuous compliance scoring',
    formaos: 'yes',
    competitor: 'yes',
  },
  {
    feature: 'Cloud infrastructure scanning',
    formaos: 'Via integrations',
    competitor: 'Native (200+ integrations)',
  },
] as const;

const competitorStrengths = [
  'Your compliance program is primarily SOC 2, ISO 27001, or HIPAA and you need automated evidence collection from 200+ cloud infrastructure integrations (AWS, Azure, GCP, Okta, GitHub)',
  'You need a trust center / trust report page to share compliance status publicly with customers and prospects',
  'You want an established vendor with a large auditor network and a marketplace of pre-built integrations for cloud-native environments',
] as const;

const procurementChecks = [
  {
    title: 'Data residency documentation',
    detail:
      'AU-hosted by default. Current hosting posture, DPA details, and additional residency requirements are reviewed with legal and procurement teams.',
  },
  {
    title: 'Security review packet',
    detail:
      'Architecture, AES-256 encryption, TLS 1.3, penetration testing, and SOC 2-aligned controls packaged for fast procurement and security review.',
  },
  {
    title: 'Enterprise SSO and identity governance',
    detail:
      'SAML SSO and MFA controls are available for enterprise deployments. Additional identity-lifecycle requirements are confirmed during procurement.',
  },
] as const;

export default function CompareVantaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
              { name: 'FormaOS vs Vanta', path: '/compare/vanta' },
            ]),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <ComparePageTemplate
        competitor="Vanta"
        heroDescription="Vanta is widely used for security compliance automation. FormaOS is built to operationalize compliance as a full execution system - with named accountability, evidence defensibility, data sovereignty, and regulated-sector coverage beyond security teams."
        points={points}
        idealIf={idealIf}
        procurementChecks={procurementChecks}
        featureComparison={featureComparison}
        competitorStrengths={competitorStrengths}
        source="compare_vanta"
        datePublished="2026-03-14"
      />
    </>
  );
}
