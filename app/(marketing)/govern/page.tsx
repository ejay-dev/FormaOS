import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';
import { siteUrl } from '@/lib/seo';
import { CLAIM_PHRASES } from '@/lib/marketing/claims';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Govern Compliance',
  description:
    'Govern enterprise compliance with executive visibility, risk prioritisation, and cross-workflow orchestration.',
  alternates: {
    canonical: `${siteUrl}/govern`,
  },
  openGraph: {
    title: 'Govern Compliance | FormaOS',
    description:
      'Govern enterprise compliance with executive visibility, risk prioritisation, and cross-workflow orchestration.',
    type: 'website',
    url: `${siteUrl}/govern`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Govern Compliance | FormaOS',
    description:
      'Govern enterprise compliance with executive visibility, risk prioritisation, and cross-workflow orchestration.',
  },
};

export default function GovernPage() {
  return (
    <OutcomeJourneyPage
      badge="Last of four: Govern"
      title="Govern compliance from a single view"
      description="Turn fragmented status updates into a unified operating picture for executives, operators, and audit stakeholders."
      proofLabel="Behind every posture view"
      proofValue={CLAIM_PHRASES.evaluators}
      proofNote="Built for leaders who need a single posture view across teams, obligations, evidence, and unresolved exceptions."
      workflow={[
        'Aggregate posture by framework and team',
        'Prioritise risk and unblock critical controls',
        'Track remediation and accountability cadence',
        'Report readiness to leadership and customers',
      ]}
      pillarsEyebrow="Govern in FormaOS"
      pillarsTitle="Give leadership one operating view of compliance"
      pillarsDescription="Govern helps executives, risk leaders, and assurance teams review posture without waiting for manual rollups."
      pillars={[
        {
          title: 'Cross-team posture',
          detail:
            'See framework alignment, task health, and evidence readiness in one place across business units.',
          href: '/product',
          cta: 'Review the product model',
        },
        {
          title: 'Board and buyer reporting',
          detail:
            'Turn the same operating data into leadership updates, procurement responses, and assurance narratives.',
          href: '/enterprise',
          cta: 'See the enterprise path',
        },
        {
          title: 'Trust review support',
          detail:
            'Move from internal posture to external review with trust documentation and proof paths already prepared.',
          href: '/trust',
          cta: 'Open the trust center',
        },
        {
          title: 'Back to the start: Evaluate',
          detail:
            'These four pages read in order: evaluate, prove, operate, govern. Govern is the last of them.',
          href: '/evaluate',
          cta: 'Read Evaluate',
        },
      ]}
      trustArtifacts={[
        'Framework-level posture',
        'Cross-team accountability',
        'Board-ready exports',
        'Trust packet path',
      ]}
      outcomes={[
        'Create one source of compliance truth across teams and entities.',
        'Improve leadership decision speed with risk-prioritised visibility.',
        'Accelerate board, customer, and regulator readiness updates.',
        'Strengthen governance with measurable control-operating confidence.',
      ]}
      journeyKey="govern"
      mediaSrc="/marketing-media/govern.jpg"
    />
  );
}
