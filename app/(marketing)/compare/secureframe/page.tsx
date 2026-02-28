import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Secureframe',
  description:
    'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
  alternates: {
    canonical: `${siteUrl}/compare/secureframe`,
  },
  openGraph: {
    title: 'FormaOS | Compare: Secureframe',
    description:
      'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
    type: 'website',
    url: `${siteUrl}/compare/secureframe`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Secureframe — Compare Compliance Platforms',
    description:
      'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
  },
};

const points = [
  {
    title: 'Compliance as an operating model',
    detail:
      'FormaOS connects governance structure to the work that proves compliance: policies, tasks, evidence, and audit history in one chain.',
  },
  {
    title: 'Verification layer for evidence',
    detail:
      'FormaOS emphasizes verification status, segregation, and audit history so evidence is defensible, not just stored.',
  },
  {
    title: 'Execution visibility for leadership',
    detail:
      'FormaOS is built to communicate readiness as operational truth: owners, deadlines, gaps, and posture snapshots.',
  },
] as const;

const idealIf = [
  'Your audits depend on operations (not only security policy)',
  'You need verified evidence and approval history',
  'You want a single control execution view across teams',
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

export default function CompareSecureframePage() {
  return (
    <ComparePageTemplate
      competitor="Secureframe"
      heroDescription="Secureframe helps teams organize compliance programs. FormaOS is built to operationalize compliance into governed workflows and verified evidence chains, designed for audit defense."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      source="compare_secureframe"
    />
  );
}
