import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import { brand } from '@/config/brand';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title:
    'FormaOS vs CompliSpace — Australian Compliance Platform Comparison | FormaOS',
  description:
    'FormaOS vs CompliSpace: operational compliance execution across 5 regulated industries vs compliance training and policy management for education and childcare.',
  alternates: {
    canonical: `${siteUrl}/compare/complispace`,
  },
  openGraph: {
    title:
      'FormaOS vs CompliSpace — Australian Compliance Platform Comparison | FormaOS',
    description:
      'FormaOS vs CompliSpace: operational compliance execution across 5 regulated industries vs compliance training and policy management for education and childcare.',
    type: 'website',
    url: `${siteUrl}/compare/complispace`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs CompliSpace - Compare Australian Compliance Platforms',
    description:
      'FormaOS vs CompliSpace: operational compliance execution across 5 regulated industries vs compliance training and policy management for education and childcare.',
  },
  keywords: [
    'FormaOS vs CompliSpace',
    'Australian compliance platform',
    'compliance training comparison',
    'education compliance',
    'childcare compliance',
    'NDIS compliance',
    'operational compliance',
  ],
};

const points = [
  {
    title: 'Operational compliance execution, not just training and policies',
    detail:
      'CompliSpace helps organisations distribute policies and deliver compliance training. FormaOS goes further — executing compliance as governed workflows where every control is tied to tasks, named owners, and verified evidence. Training awareness becomes proven operational compliance.',
  },
  {
    title: 'Five regulated industries, not just education',
    detail:
      'FormaOS ships with pre-built frameworks for NDIS, aged care, healthcare, childcare, and construction. CompliSpace has deep expertise in education and childcare compliance. FormaOS covers the full spectrum of AU-regulated sectors with operational workflows for each.',
  },
  {
    title: 'Evidence chains that prove compliance execution',
    detail:
      'FormaOS treats evidence as verified artefacts with named reviewers, approval timestamps, and chain-of-custody trails. This creates audit-defensible proof that compliance was executed — not just that policies were distributed or training was completed.',
  },
  {
    title: 'Named ownership and accountability tracking',
    detail:
      'Every control, task, and evidence item in FormaOS has a named owner with escalation paths and approval histories recorded automatically. Accountability goes beyond training completion records to operational execution tracking.',
  },
  {
    title: 'Audit readiness beyond training records',
    detail:
      'FormaOS provides continuous compliance scoring, audit-ready evidence packs, and real-time posture dashboards. Auditors see verified execution across every framework — not just training completion rates and policy acknowledgement logs.',
  },
  {
    title: 'Multi-framework governance in one platform',
    detail:
      'FormaOS manages compliance across multiple regulatory frameworks simultaneously — NDIS Practice Standards, NQF/NQS, WHS, Privacy Act, and more — with cross-framework control mapping. CompliSpace focuses on sector-specific policy and training needs.',
  },
] as const;

const idealIf = [
  'You need operational compliance execution — not just compliance training and policy distribution',
  'Your organisation operates across multiple regulated sectors (NDIS, healthcare, aged care, childcare, construction) and needs unified governance',
  'Auditors require verified evidence with named approvers and chain-of-custody — not just training completion records',
  'You want continuous compliance scoring and real-time posture dashboards across all active frameworks',
  'Your compliance program has outgrown training-centric tools and needs workflow-driven execution with named ownership',
  'You need cross-framework control mapping to manage overlapping regulatory obligations efficiently',
] as const;

const featureComparison = [
  {
    feature: 'Operational compliance workflows',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Compliance training modules',
    formaos: 'partial',
    competitor: 'yes',
  },
  {
    feature: 'Policy distribution and acknowledgement',
    formaos: 'partial',
    competitor: 'yes',
  },
  {
    feature: 'Education sector compliance (NQF/NQS)',
    formaos: 'yes',
    competitor: 'yes',
  },
  {
    feature: 'NDIS Practice Standards (all 8 modules)',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Healthcare compliance (AHPRA, NSQHS, RACGP)',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Aged care Quality Standards',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Evidence verification with approval chain',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Named control ownership with audit trail',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Continuous compliance scoring',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'AU data residency by default',
    formaos: 'AU-hosted by default',
    competitor: 'AU-hosted',
  },
  {
    feature: 'Pre-built industry frameworks',
    formaos: `${brand.frameworks.count} frameworks`,
    competitor: 'Education & childcare focused',
  },
] as const;

const competitorStrengths = [
  'Your primary compliance need is staff training, policy distribution, and compliance awareness — and your organisation operates in education or early childhood education and care (ECEC)',
  'You need a platform with deep expertise in education sector regulatory requirements, including Child Safe Standards, teacher registration, and school governance obligations',
  'You want a compliance training LMS with built-in course content, completion tracking, and policy acknowledgement workflows tailored to Australian education and childcare providers',
] as const;

const procurementChecks = [
  {
    title: 'Security review packet',
    detail:
      'Architecture, identity governance, encryption posture, and assurance context documented for early buyer review.',
  },
  {
    title: 'DPA and vendor assurance',
    detail:
      'Data processing agreement, vendor assurance materials, and enterprise service terms are available for legal, risk, and procurement review.',
  },
  {
    title: 'Enterprise identity controls',
    detail:
      'SAML SSO and MFA controls are part of enterprise evaluation. Additional identity-lifecycle requirements are confirmed during procurement review.',
  },
] as const;

export default function CompareCompliSpacePage() {
  return (
    <ComparePageTemplate
      competitor="CompliSpace"
      heroDescription="CompliSpace is an Australian compliance platform with deep expertise in education and childcare sector training and policy management. FormaOS takes a different approach — built to execute compliance as operational workflows across five regulated industries, with named ownership, evidence verification chains, and audit-ready posture dashboards."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      featureComparison={featureComparison}
      competitorStrengths={competitorStrengths}
      source="compare_complispace"
      datePublished="2026-04-09"
    />
  );
}
