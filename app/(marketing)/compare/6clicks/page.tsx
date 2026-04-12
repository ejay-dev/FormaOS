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
    'FormaOS vs 6clicks - Australian Compliance Platform Comparison | FormaOS',
  description:
    'FormaOS vs 6clicks: operational compliance execution with industry-specific frameworks vs AI-powered GRC with Hub & Spoke multi-entity governance.',
  alternates: {
    canonical: `${siteUrl}/compare/6clicks`,
  },
  openGraph: {
    title:
      'FormaOS vs 6clicks - Australian Compliance Platform Comparison | FormaOS',
    description:
      'FormaOS vs 6clicks: operational compliance execution with industry-specific frameworks vs AI-powered GRC with Hub & Spoke multi-entity governance.',
    type: 'website',
    url: `${siteUrl}/compare/6clicks`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs 6clicks - Compare Australian Compliance Platforms',
    description:
      'FormaOS vs 6clicks: operational compliance execution with industry-specific frameworks vs AI-powered GRC with Hub & Spoke multi-entity governance.',
  },
  keywords: [
    'FormaOS vs 6clicks',
    'Australian compliance platform',
    'GRC comparison',
    'AI risk assessment',
    'NDIS compliance',
    'operational compliance',
    'Hub and Spoke GRC',
  ],
};

const points = [
  {
    title: 'Operational compliance execution, not just risk mapping',
    detail:
      '6clicks provides AI-powered risk assessments and framework mapping. FormaOS focuses on executing compliance as governed workflows - tying every control to tasks, named owners, and verified evidence so compliance is proven through work, not assessments.',
  },
  {
    title: 'Industry-regulated frameworks beyond security',
    detail:
      'FormaOS ships with pre-built frameworks for AU-regulated industries: NDIS Practice Standards, aged care Quality Standards, healthcare (AHPRA, NSQHS), childcare (NQF/NQS), and construction (WHS). 6clicks focuses primarily on security and risk frameworks like ISO 27001, SOC 2, and NIST.',
  },
  {
    title: 'Evidence verification workflows',
    detail:
      'FormaOS treats evidence as a verified artefact - every item has a named reviewer, approval timestamp, and chain-of-custody trail. This goes beyond evidence collection to create audit-defensible proof of compliance execution.',
  },
  {
    title: 'Named accountability across every level',
    detail:
      'Every control, task, and evidence item in FormaOS has a named owner with recorded escalation paths and approval histories. Accountability is structural, not just assigned in a risk register.',
  },
  {
    title: 'Frontline-ready compliance workflows',
    detail:
      'FormaOS is built for operational managers and frontline staff who execute compliance daily - not just GRC professionals. Guided task workflows replace complex risk interfaces with clear, actionable steps.',
  },
  {
    title: 'Single-tenant focus with AU data residency',
    detail:
      'FormaOS hosts data in Australia by default and is designed for organisations that need clear data sovereignty. No Hub & Spoke complexity when your compliance needs are within a single regulatory jurisdiction.',
  },
] as const;

const idealIf = [
  'You need compliance execution workflows that frontline staff can follow - not just AI-generated risk assessments for the compliance team',
  'Your organisation operates in NDIS, aged care, healthcare, childcare, or construction and needs sector-specific regulatory frameworks',
  'Auditors require verified evidence with named approvers and chain-of-custody - not just mapped controls',
  'You want named ownership and escalation tracking at every control and task level',
  'Your compliance program spans regulated industries beyond security frameworks like ISO and SOC 2',
  'You need a platform where operational managers can run compliance without GRC expertise',
] as const;

const featureComparison = [
  {
    feature: 'Operational compliance workflows',
    formaos: 'yes',
    competitor: 'no',
  },
  {
    feature: 'AI-powered risk assessments',
    formaos: 'partial',
    competitor: 'yes',
  },
  {
    feature: 'Hub & Spoke multi-entity model',
    formaos: 'no',
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
    feature: 'ISO 27001 / SOC 2 frameworks',
    formaos: 'yes',
    competitor: 'yes',
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
    competitor: '30+ security & risk frameworks',
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
  'You manage compliance across multiple entities or subsidiaries and need a Hub & Spoke model to cascade frameworks, controls, and policies from a central team to distributed business units',
  'Your compliance program is primarily focused on security frameworks (ISO 27001, SOC 2, NIST, CPS 234) and you value AI-assisted risk assessments and automated control mapping',
  'You are an Australian enterprise or consultancy that needs a multi-tenant GRC platform with strong framework coverage and reciprocal risk management across client portfolios',
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

export default function Compare6clicksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
              { name: 'FormaOS vs 6clicks', path: '/compare/6clicks' },
            ]),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <ComparePageTemplate
        competitor="6clicks"
        heroDescription="6clicks is an Australian GRC platform with AI-powered risk assessments and a Hub & Spoke model for multi-entity governance. FormaOS takes a different approach - built to execute compliance as operational workflows with pre-built frameworks for AU-regulated industries, named ownership, and evidence verification chains."
        points={points}
        idealIf={idealIf}
        procurementChecks={procurementChecks}
        featureComparison={featureComparison}
        competitorStrengths={competitorStrengths}
        source="compare_6clicks"
        datePublished="2026-04-09"
      />
    </>
  );
}
