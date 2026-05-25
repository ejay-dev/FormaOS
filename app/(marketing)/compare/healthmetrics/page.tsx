import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import { brand } from '@/config/brand';
import { JsonLd } from '@/components/JsonLd';
import {
  siteUrl,
  breadcrumbSchema,
  softwareApplicationSchema,
} from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'FormaOS vs HealthMetrics - Compliance Comparison | FormaOS',
  description:
    'FormaOS vs HealthMetrics: operational compliance execution with named ownership and verified evidence chains vs clinical governance and quality reporting tools.',
  alternates: {
    canonical: `${siteUrl}/compare/healthmetrics`,
  },
  openGraph: {
    title:
      'FormaOS vs HealthMetrics - Compliance Comparison | FormaOS',
    description:
      'FormaOS vs HealthMetrics: operational compliance execution with named ownership and verified evidence chains vs clinical governance and quality reporting tools.',
    type: 'website',
    url: `${siteUrl}/compare/healthmetrics`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs HealthMetrics - Compare Care Compliance Platforms',
    description:
      'FormaOS vs HealthMetrics: operational compliance execution with named ownership and verified evidence chains vs clinical governance and quality reporting tools.',
  },
  keywords: [
    'FormaOS vs HealthMetrics',
    'aged care compliance',
    'healthcare compliance Australia',
    'clinical governance software',
    'NDIS compliance',
    'NSQHS standards',
  ],
};

const points = [
  {
    title: 'Compliance execution, not just clinical reporting',
    detail:
      'HealthMetrics is strong on clinical indicator reporting and quality dashboards. FormaOS goes further by tying every NDIS, aged-care, and healthcare control to operational tasks, named owners, and approval-verified evidence — turning compliance into executed work, not just a report.',
  },
  {
    title: 'Cross-industry frameworks in one platform',
    detail:
      'FormaOS ships with NDIS Practice Standards, Aged Care Quality Standards, NSQHS, AHPRA, RACGP, NQF/NQS, and WHS. HealthMetrics focuses on healthcare and aged care — FormaOS supports the full regulated-care surface (including childcare, allied health, and disability) on one tenant.',
  },
  {
    title: 'Evidence chain-of-custody for regulators',
    detail:
      'Every piece of evidence in FormaOS has an approval chain, timestamp, and named reviewer. HealthMetrics centres on data collection and indicator dashboards; FormaOS is built around defensible audit trails that regulators can follow from control to proof.',
  },
  {
    title: 'Named ownership at every control level',
    detail:
      'FormaOS assigns named accountability to every control, task, and evidence item — with auto-recorded escalation and approval history. Clinical governance tools tend to track outcomes; FormaOS tracks who did what, when, and what evidence they signed off on.',
  },
  {
    title: 'Operator workflows for frontline staff',
    detail:
      'FormaOS guides frontline operators (care managers, registered nurses, support workers, RTOs) through compliance work — visit checks, credential reviews, incident workflows. HealthMetrics is typically used by quality teams; FormaOS is used by everyone who has a compliance task.',
  },
  {
    title: 'AU data residency by default',
    detail:
      'FormaOS hosts data in Australia by default, with no enterprise add-on or special configuration required. Aligns with Privacy Act, NDIS Quality and Safeguards Commission, and Aged Care Quality and Safety Commission expectations out of the box.',
  },
] as const;

const idealIf = [
  'You operate across NDIS, aged care, healthcare, allied health, or childcare and need a single compliance platform spanning all of them',
  'Your auditors and regulators want evidence-with-approver, not just clinical-indicator dashboards',
  'You need named ownership and escalation tracking at every control — not just outcome reporting',
  'Frontline staff (not just quality teams) need to complete compliance work without specialist training',
  'You want pre-built frameworks for NDIS Practice Standards, Aged Care Quality Standards, NSQHS, AHPRA, and RACGP in one product',
  'AU data residency is mandatory, not an add-on',
] as const;

const featureComparison = [
  {
    feature: 'Operational compliance workflows (tasks, owners, deadlines)',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Clinical indicator reporting and quality dashboards',
    formaos: 'partial',
    competitor: 'yes',
  },
  {
    feature: 'NDIS Practice Standards (all 8 modules)',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Aged Care Quality Standards',
    formaos: 'yes',
    competitor: 'yes',
  },
  {
    feature: 'NSQHS, AHPRA, RACGP frameworks',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'Childcare (NQF/NQS) and WHS frameworks',
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
    competitor: 'Healthcare and aged-care focused',
  },
  {
    feature: 'Frontline operator guided workflows',
    formaos: 'yes',
    competitor: 'partial',
  },
  {
    feature: 'SAML 2.0 SSO (Okta, Azure AD, Google)',
    formaos: 'Enterprise plan',
    competitor: 'Enterprise plan',
  },
] as const;

const competitorStrengths = [
  'Your primary need is clinical indicator capture, benchmarking, and quality reporting — and your compliance program is led by a dedicated quality team',
  'You operate exclusively in healthcare or aged care and want a long-standing clinical-governance vendor with deep indicator libraries',
  'Indicator dashboards and benchmarking against peers is more valuable to you than control-level operational accountability',
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
      'Data processing agreement, vendor assurance materials, and enterprise service terms available for legal, risk, and procurement review.',
  },
  {
    title: 'Enterprise identity controls',
    detail:
      'SAML SSO and MFA controls are part of enterprise evaluation. Additional identity-lifecycle requirements are confirmed during procurement review.',
  },
] as const;

export default function CompareHealthMetricsPage() {
  return (
    <>
      <JsonLd data={[
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
              {
                name: 'FormaOS vs HealthMetrics',
                path: '/compare/healthmetrics',
              },
            ]),
            softwareApplicationSchema(),
          ]} />
      <ComparePageTemplate
        competitor="HealthMetrics"
        heroDescription="HealthMetrics is a long-standing Australian clinical governance and quality-reporting platform for healthcare and aged care. FormaOS takes a different approach — built to run compliance as operational workflows with named ownership, verified evidence chains, and pre-built frameworks across the full regulated-care surface (NDIS, aged care, healthcare, allied health, childcare, WHS)."
        points={points}
        idealIf={idealIf}
        procurementChecks={procurementChecks}
        featureComparison={featureComparison}
        competitorStrengths={competitorStrengths}
        source="compare_healthmetrics"
        datePublished="2026-05-07"
      />
    </>
  );
}
