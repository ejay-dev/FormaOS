import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Evaluate Compliance',
  description:
    'Evaluate obligations, controls, and evidence readiness before risk becomes exposure.',
  alternates: {
    canonical: `${siteUrl}/evaluate`,
  },
};

export default function EvaluatePage() {
  return (
    <OutcomeJourneyPage
      badge="Outcome Journey · Evaluate"
      title="Evaluate Compliance Exposure Before It Becomes Audit Risk"
      description="Map obligations to live controls, identify evidence gaps, and surface readiness blockers before auditors or customers find them."
      proofLabel="Average first-risk detection"
      proofValue="< 24 hours"
      workflow={[
        'Map frameworks to active controls',
        'Run evidence completeness scans',
        'Score critical control coverage',
        'Queue remediation priorities',
      ]}
      outcomes={[
        'Expose hidden control ownership gaps before external assessments.',
        'Give leaders a clear pre-audit risk baseline in one operating view.',
        'Convert fragmented checklists into measurable control confidence.',
        'Create a defensible record of compliance decisions over time.',
      ]}
      journeyKey="evaluate"
    />
  );
}
