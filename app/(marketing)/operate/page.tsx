import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

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
      proofLabel="Control-task accountability"
      proofValue="100% traceable"
      workflow={[
        'Operationalize controls into recurring tasks',
        'Assign owners and due-date accountability',
        'Monitor completion and evidence health',
        'Escalate workflow exceptions in real time',
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
