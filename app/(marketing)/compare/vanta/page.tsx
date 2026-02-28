import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

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
    title: 'FormaOS vs Vanta — Compare Compliance Platforms',
    description:
      'FormaOS vs Vanta: operational compliance execution with defensible evidence workflows and audit-ready governance.',
  },
};

const points = [
  {
    title: 'Execution-first operating system',
    detail:
      'FormaOS is designed to run compliance as work: controls become tasks, owners, deadlines, and evidence requirements.',
  },
  {
    title: 'Evidence defensibility workflows',
    detail:
      'Verification status, audit history, and chain-of-custody context reduce reviewer ambiguity and improve audit response.',
  },
  {
    title: 'Built for regulated operators',
    detail:
      'Beyond security teams: FormaOS supports operational compliance patterns across healthcare, disability services, and multi-site environments.',
  },
] as const;

const idealIf = [
  'You need workflows that enforce accountability across teams',
  'Evidence should be verified and defensible, not only collected',
  'You want posture reporting that maps to operational reality',
] as const;

const procurementChecks = [
  {
    title: 'Security review acceleration',
    detail:
      'Use the FormaOS security review packet to address architecture and control questions early.',
  },
  {
    title: 'Defensible workflow proof',
    detail:
      'Demonstrate owner-level execution with tasks, approvals, and evidence history in one chain.',
  },
  {
    title: 'Pilot-to-rollout confidence',
    detail:
      'Start with one business unit, validate outcomes, then scale to broader teams and entities.',
  },
] as const;

export default function CompareVantaPage() {
  return (
    <ComparePageTemplate
      competitor="Vanta"
      heroDescription="Vanta is widely used for compliance automation. FormaOS is built to operationalize compliance as an execution system with evidence defensibility at the workflow level."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      source="compare_vanta"
    />
  );
}
