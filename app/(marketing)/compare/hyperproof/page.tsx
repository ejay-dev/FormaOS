import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Hyperproof',
  description:
    'FormaOS vs Hyperproof: continuous compliance operations with stronger accountability, evidence defensibility, and buyer-ready trust workflows.',
  alternates: {
    canonical: `${siteUrl}/compare/hyperproof`,
  },
  openGraph: {
    title: 'FormaOS | Compare: Hyperproof',
    description:
      'FormaOS vs Hyperproof: continuous compliance operations with stronger accountability, evidence defensibility, and buyer-ready trust workflows.',
    type: 'website',
    url: `${siteUrl}/compare/hyperproof`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Hyperproof - Compare Compliance Platforms',
    description:
      'Compare Hyperproof and FormaOS across workflow accountability, evidence verification, and procurement readiness.',
  },
};

const points = [
  {
    title: 'Accountability is structural',
    detail:
      'FormaOS enforces ownership and review paths inside the workflow itself, reducing the reliance on manual follow-up across fragmented tools.',
  },
  {
    title: 'Evidence has stronger chain-of-custody context',
    detail:
      'Artifacts stay tied to approvals, timestamps, and corrective actions so buyers and auditors can inspect the operational history, not just the document library.',
  },
  {
    title: 'Stronger regulated-sector positioning',
    detail:
      'Hyperproof fits modern compliance teams well. FormaOS pushes harder into regulated operating environments where care delivery, workforce controls, and incidents all affect readiness.',
  },
  {
    title: 'Trust center and procurement workflows are closer to the core journey',
    detail:
      'Security review assets, trust documentation, and enterprise buying flows are part of the acquisition path instead of living as a separate afterthought.',
  },
] as const;

const idealIf = [
  'You need control execution and evidence posture visible to both operators and buyers',
  'Your team wants to reduce manual coordination between task tools, policy tools, and trust artifacts',
  'Audit readiness depends on frontline actions, not only central compliance coordination',
  'Regulated workflows like incidents, workforce governance, and site-level ownership must stay auditable',
] as const;

const featureComparison = [
  { feature: 'Operational workflow enforcement', formaos: 'yes', competitor: 'partial' },
  { feature: 'Evidence verification and review chain', formaos: 'yes', competitor: 'partial' },
  { feature: 'Buyer trust and procurement flow', formaos: 'yes', competitor: 'partial' },
  { feature: 'Control management and mapping', formaos: 'yes', competitor: 'yes' },
  { feature: 'Regulated service-delivery use cases', formaos: 'yes', competitor: 'partial' },
  { feature: 'Incident-to-remediation workflow', formaos: 'yes', competitor: 'partial' },
  { feature: 'Continuous posture scoring', formaos: 'yes', competitor: 'yes' },
  { feature: 'Export-ready evidence bundles', formaos: 'yes', competitor: 'yes' },
];

const competitorStrengths = [
  'You want a dedicated compliance operations tool focused on control mapping and program management without a heavier buyer-trust narrative',
  'Your organization is comfortable keeping trust-center, security review, and workflow execution in separate systems',
  'Your primary need is central compliance coordination rather than frontline operational accountability',
] as const;

const procurementChecks = [
  {
    title: 'Chain-of-custody clarity',
    detail:
      'Verify whether the platform can prove how an artifact moved from request to approval to audit export without gaps.',
  },
  {
    title: 'Frontline ownership model',
    detail:
      'Assess whether operators can be held accountable in-system rather than through external reminders and spreadsheets.',
  },
  {
    title: 'Trust acceleration',
    detail:
      'Review how quickly legal, procurement, and security teams can get from initial interest to documented assurance.',
  },
] as const;

export default function CompareHyperproofPage() {
  return (
    <ComparePageTemplate
      competitor="Hyperproof"
      heroDescription="Hyperproof helps teams manage controls and compliance programs. FormaOS is built to make that work operationally defensible, buyer-ready, and accountable across the frontline workflows that actually determine compliance truth."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      featureComparison={featureComparison}
      competitorStrengths={competitorStrengths}
      source="compare_hyperproof"
    />
  );
}
