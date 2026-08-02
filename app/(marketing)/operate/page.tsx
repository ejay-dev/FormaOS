import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';
import { siteUrl } from '@/lib/seo';
import { CLAIM_PHRASES } from '@/lib/marketing/claims';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Operate Compliance',
  description:
    'Operate compliance continuously with accountable workflows, task orchestration, and real-time signals.',
  alternates: {
    canonical: `${siteUrl}/operate`,
  },
  openGraph: {
    title: 'Operate Compliance | FormaOS',
    description:
      'Operate compliance continuously with accountable workflows, task orchestration, and real-time signals.',
    type: 'website',
    url: `${siteUrl}/operate`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Operate Compliance | FormaOS',
    description:
      'Operate compliance continuously with accountable workflows, task orchestration, and real-time signals.',
  },
};

export default function OperatePage() {
  return (
    <OutcomeJourneyPage
      badge="Third of four: Operate"
      title="Operate compliance as a live system, not a quarterly event"
      description="Run controls as daily operations with workflows, ownership, and signals that keep teams ahead of drift."
      proofLabel="Checked against your own data"
      proofValue={CLAIM_PHRASES.automatedChecks}
      proofNote="Designed for teams that need recurring control work, clear escalation paths, and evidence captured at the point of completion."
      workflow={[
        'Turn controls into recurring tasks',
        'Assign owners and due-date accountability',
        'Monitor completion and evidence health',
        'Escalate workflow exceptions in real time',
      ]}
      pillarsEyebrow="Operate in FormaOS"
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
        {
          title: 'Next: Govern',
          detail:
            'These four pages read in order: evaluate, prove, operate, govern. Govern covers what leadership sees once the work is running.',
          href: '/govern',
          cta: 'Read Govern',
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
      mediaSrc="/marketing-media/operate.jpg"
    />
  );
}
