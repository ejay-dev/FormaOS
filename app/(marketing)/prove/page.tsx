import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'FormaOS | Prove Compliance',
  description:
    'Generate defensible audit proof with traceable evidence, linked controls, and full-chain context.',
  alternates: {
    canonical: `${siteUrl}/prove`,
  },
};

export default function ProvePage() {
  return (
    <OutcomeJourneyPage
      badge="Outcome Journey · Prove"
      title="Prove Compliance With Defensible Evidence, Not Last-Minute Documents"
      description="Build an evidence chain that links obligations, controls, owners, and outcomes so audits move from panic to confidence."
      proofLabel="Typical audit bundle prep"
      proofValue="< 30 minutes"
      workflow={[
        'Collect evidence at execution time',
        'Attach controls and owner accountability',
        'Review exceptions and approvals',
        'Export audit-ready proof packages',
      ]}
      outcomes={[
        'Reduce audit prep cycles from weeks to operational minutes.',
        'Give auditors context-rich, source-linked evidence from day one.',
        'Prevent version drift and lost evidence across departments.',
        'Increase executive confidence in external compliance narratives.',
      ]}
      journeyKey="prove"
    />
  );
}
