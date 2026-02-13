import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Drata',
  description:
    'FormaOS vs Drata: operational workflow governance with evidence verification and audit-ready execution.',
  alternates: {
    canonical: `${siteUrl}/compare/drata`,
  },
};

const points = [
  {
    title: 'Continuous posture through operations',
    detail:
      'FormaOS keeps posture current by tying control status to tasks, ownership, and evidence verification workflows.',
  },
  {
    title: 'Defensible audit history',
    detail:
      'FormaOS emphasizes chain-of-custody context and audit logs so reviewers can trace what happened and who approved it.',
  },
  {
    title: 'Outcome-centric execution model',
    detail:
      'FormaOS is designed around "prove readiness" workflows, not page-centric compliance management.',
  },
] as const;

const idealIf = [
  'You need accountability across frontline operators and managers',
  'Auditors require defensible, contextual evidence and approvals',
  'You want a single operating view of compliance execution',
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

export default function CompareDrataPage() {
  return (
    <ComparePageTemplate
      competitor="Drata"
      heroDescription="Drata helps teams monitor compliance. FormaOS is built to run compliance as a governed operating system, linking controls to execution, verification, and defensible evidence."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      source="compare_drata"
    />
  );
}
