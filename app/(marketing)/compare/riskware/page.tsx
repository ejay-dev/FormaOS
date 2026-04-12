import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import { brand } from '@/config/brand';
import {
  siteUrl,
  breadcrumbSchema,
  softwareApplicationSchema,
} from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'FormaOS vs Riskware - Australian Compliance Platform Comparison | FormaOS',
  description:
    'FormaOS vs Riskware: operational compliance workflows with industry-specific frameworks, named ownership, and evidence chains vs traditional GRC risk management.',
  alternates: {
    canonical: `${siteUrl}/compare/riskware`,
  },
  openGraph: {
    title:
      'FormaOS vs Riskware - Australian Compliance Platform Comparison | FormaOS',
    description:
      'FormaOS vs Riskware: operational compliance workflows with industry-specific frameworks, named ownership, and evidence chains vs traditional GRC risk management.',
    type: 'website',
    url: `${siteUrl}/compare/riskware`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Riskware - Compare Australian Compliance Platforms',
    description:
      'FormaOS vs Riskware: operational compliance workflows with industry-specific frameworks, named ownership, and evidence chains vs traditional GRC risk management.',
  },
  keywords: [
    'FormaOS vs Riskware',
    'Australian compliance platform',
    'GRC comparison',
    'risk management Australia',
    'NDIS compliance',
    'operational compliance',
  ],
};

const points = [
  {
    title: 'Operational compliance execution, not just risk registers',
    detail:
      'Riskware excels at risk management and internal audit workflows. FormaOS goes further by tying compliance controls to daily operational tasks, named owners, and evidence verification - turning compliance into executed work rather than documented risk.',
  },
  {
    title: 'Industry-specific frameworks built in',
    detail:
      'FormaOS ships with pre-built frameworks for NDIS Practice Standards, aged care Quality Standards, healthcare (AHPRA, NSQHS, RACGP), childcare (NQF/NQS), and construction (WHS). Riskware provides a general GRC platform that requires custom configuration for these sectors.',
  },
  {
    title: 'Evidence chains with verification workflows',
    detail:
      'Every piece of evidence in FormaOS has an approval chain, timestamp, and named reviewer. Evidence is verified - not just uploaded. This creates defensible audit trails that regulators can follow from control to proof.',
  },
  {
    title: 'Named ownership at every control level',
    detail:
      'FormaOS assigns named accountability to every control, task, and evidence item. Escalation paths and approval histories are recorded automatically, replacing the manual follow-up common in traditional GRC platforms.',
  },
  {
    title: 'Frontline operator workflows',
    detail:
      'FormaOS is designed for frontline workers and operational managers - not just risk and compliance teams. Guided workflows help staff complete compliance tasks without needing GRC expertise.',
  },
  {
    title: 'AU data residency by default',
    detail:
      'FormaOS hosts data in Australia by default, meeting data sovereignty requirements for government, healthcare, and regulated industries without requiring special configuration or enterprise add-ons.',
  },
] as const;

const idealIf = [
  'You need compliance execution workflows for frontline operators - not just risk registers for the compliance team',
  'Your organisation operates in NDIS, aged care, healthcare, childcare, or construction and needs pre-built regulatory frameworks',
  'Auditors require defensible evidence with verification chains, named approvers, and complete audit history',
  'You want named ownership and escalation tracking at every control level - not just assigned risk owners',
  'AU data residency is a requirement, not an optional add-on',
  'You need a compliance platform that staff can use without GRC training',
] as const;

const featureComparison = [
  {
    feature: 'Operational compliance workflows',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'Risk register and risk management',
    formaos: 'yes',
    competitor: 'yes',
  },
  {
    feature: 'Internal audit module',
    formaos: 'partial',
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
    competitor: 'partial',
  },
  {
    feature: 'Named control ownership with audit trail',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'AU data residency by default',
    formaos: 'AU-hosted by default',
    competitor: 'AU-hosted',
  },
  {
    feature: 'Pre-built industry frameworks',
    formaos: `${brand.frameworks.count} frameworks`,
    competitor: 'General GRC templates',
  },
  {
    feature: 'Frontline operator guided workflows',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'SAML 2.0 SSO (Okta, Azure AD, Google)',
    formaos: 'Enterprise plan',
    competitor: 'Enterprise plan',
  },
] as const;

const competitorStrengths = [
  'Your primary need is enterprise risk management with mature risk registers, heat maps, and quantitative risk analysis - and compliance is secondary to your risk program',
  'You need deep internal audit management with audit planning, fieldwork tracking, and findings management as the core workflow',
  'You are an established Australian enterprise that values a mature, long-standing GRC vendor with a traditional risk-first approach to governance',
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

export default function CompareRiskwarePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
              { name: 'FormaOS vs Riskware', path: '/compare/riskware' },
            ]),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <ComparePageTemplate
        competitor="Riskware"
        heroDescription="Riskware is a mature Australian GRC platform with strong risk management and internal audit capabilities. FormaOS takes a different approach - built to run compliance as operational workflows with industry-specific frameworks, named ownership, and evidence verification chains across every regulated sector."
        points={points}
        idealIf={idealIf}
        procurementChecks={procurementChecks}
        featureComparison={featureComparison}
        competitorStrengths={competitorStrengths}
        source="compare_riskware"
        datePublished="2026-04-09"
      />
    </>
  );
}
