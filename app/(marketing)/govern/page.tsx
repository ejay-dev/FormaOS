import type { Metadata } from 'next';
import { OutcomeJourneyPage } from '../components/outcome-journey-page';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Govern Compliance',
  description:
    'Govern enterprise compliance with executive visibility, risk prioritization, and cross-workflow orchestration.',
  alternates: {
    canonical: `${siteUrl}/govern`,
  },
};

export default function GovernPage() {
  return (
    <OutcomeJourneyPage
      badge="Outcome Journey · Govern"
      title="Govern Compliance From a Single Enterprise Command View"
      description="Turn fragmented status updates into a unified operating picture for executives, operators, and audit stakeholders."
      proofLabel="Executive readiness visibility"
      proofValue="Near real-time"
      workflow={[
        'Aggregate posture by framework and team',
        'Prioritize risk and unblock critical controls',
        'Track remediation and accountability cadence',
        'Report readiness to leadership and customers',
      ]}
      outcomes={[
        'Create one source of compliance truth across teams and entities.',
        'Improve leadership decision speed with risk-prioritized visibility.',
        'Accelerate board, customer, and regulator readiness updates.',
        'Strengthen governance with measurable control-operating confidence.',
      ]}
      journeyKey="govern"
    />
  );
}
