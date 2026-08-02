import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';
import { siteUrl } from '@/lib/seo';
import { CLAIM_PHRASES } from '@/lib/marketing/claims';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Evaluate Compliance',
  description:
    'Evaluate obligations, controls, and evidence readiness before risk becomes exposure. Map gaps, surface owner accountability, and plan remediation.',
  alternates: {
    canonical: `${siteUrl}/evaluate`,
  },
  openGraph: {
    title: 'Evaluate Compliance | FormaOS',
    description:
      'Evaluate obligations, controls, and evidence readiness before risk becomes exposure. Map gaps, surface owner accountability, and plan remediation.',
    type: 'website',
    url: `${siteUrl}/evaluate`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluate Compliance | FormaOS',
    description:
      'Evaluate obligations, controls, and evidence readiness before risk becomes exposure. Map gaps, surface owner accountability, and plan remediation.',
  },
};

export default function EvaluatePage() {
  return (
    <OutcomeJourneyPage
      badge="First of four: Evaluate"
      title="Evaluate compliance exposure before it becomes audit risk"
      description="Map obligations to live controls, identify evidence gaps, and surface readiness blockers before auditors or customers find them."
      proofLabel="Framework coverage"
      proofValue={CLAIM_PHRASES.frameworks}
      proofNote="Best for teams mapping obligations, spotting weak controls, and prioritising remediation before formal review cycles begin."
      workflow={[
        'Map frameworks to active controls',
        'Run evidence completeness scans',
        'Score critical control coverage',
        'Queue remediation priorities',
      ]}
      pillarsEyebrow="Evaluate in FormaOS"
      pillarsTitle="Find weak spots before the review starts"
      pillarsDescription="Evaluate gives teams a practical way to connect obligations, control coverage, and evidence health before a customer, auditor, or regulator asks."
      pillars={[
        {
          title: 'Framework mapping',
          detail:
            'Understand how obligations connect to active controls, owners, and evidence expectations across the program.',
          href: '/frameworks',
          cta: 'Review framework coverage',
        },
        {
          title: 'Operating model comparison',
          detail:
            'See how a compliance operating system differs from checklist-only tooling when teams need accountable execution.',
          href: '/compare',
          cta: 'Compare approaches',
        },
        {
          title: 'Evidence readiness',
          detail:
            'Spot missing records and remediation priorities before gaps become high-friction review issues.',
          href: '/audit-evidence-management',
          cta: 'Explore evidence readiness',
        },
        {
          title: 'Next: Prove',
          detail:
            'These four pages read in order: evaluate, prove, operate, govern. Prove covers what happens once you know where the gaps are.',
          href: '/prove',
          cta: 'Read Prove',
        },
      ]}
      trustArtifacts={[
        'Framework mapping',
        'Gap visibility',
        'Remediation priorities',
        'Risk review cadence',
      ]}
      outcomes={[
        'Expose hidden control ownership gaps before external assessments.',
        'Give leaders a clear pre-audit risk baseline in one operating view.',
        'Convert fragmented checklists into measurable control confidence.',
        'Create a defensible record of compliance decisions over time.',
      ]}
      journeyKey="evaluate"
      mediaSrc="/marketing-media/evaluate.jpg"
    />
  );
}
