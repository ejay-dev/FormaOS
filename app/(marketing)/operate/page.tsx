import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'FormaOS | Operate Compliance',
  description:
    'Operate compliance continuously with accountable workflows, task orchestration, and real-time signals.',
  alternates: {
    canonical: `${siteUrl}/operate`,
  },
};

export default function OperatePage() {
  return (
    <OutcomeJourneyPage
      badge="Outcome Journey · Operate"
      title="Operate Compliance as a Live System, Not a Quarterly Event"
      description="Run controls as daily operations with workflows, ownership, and signals that keep teams ahead of drift."
      proofLabel="Operating signal"
      proofValue="Owned execution"
      proofNote="Designed for teams that need recurring control work, clear escalation paths, and evidence captured at the point of completion."
      workflow={[
        'Operationalize controls into recurring tasks',
        'Assign owners and due-date accountability',
        'Monitor completion and evidence health',
        'Escalate workflow exceptions in real time',
      ]}
      pillarsEyebrow="Operate In FormaOS"
      pillarsTitle="Turn policy intent into day-to-day execution"
      pillarsDescription="Operate is the layer where compliance stops being a quarterly clean-up exercise and becomes owned work across teams."
      pillars={[
        {
          title: 'Recurring control work',
          detail:
            'Set control cadence, expected evidence, and ownership so work is visible before it drifts.',
          href: '/product',
          cta: 'See the product flow',
        },
        {
          title: 'Escalation paths',
          detail:
            'Move blockers to the right people with governance context instead of chasing updates across tools.',
          href: '/features',
          cta: 'Explore workflow features',
        },
        {
          title: 'Evidence at completion',
          detail:
            'Keep proof attached to the work itself so operational follow-through becomes review-ready history.',
          href: '/prove',
          cta: 'See how proof works',
        },
      ]}
      trustArtifacts={[
        'Named control ownership',
        'Task-to-evidence linkage',
        'Exception visibility',
        'Audit trail history',
      ]}
      outcomes={[
        'Embed compliance into operational execution instead of periodic cleanup.',
        'Lower control drift through continuous evidence-backed task completion.',
        'Give managers immediate visibility into blocked compliance workflows.',
        'Scale multi-team execution without sacrificing governance clarity.',
      ]}
      journeyKey="operate"
    />
  );
}
