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
  openGraph: {
    title: 'Prove Compliance | FormaOS',
    description:
      'Generate defensible audit proof with traceable evidence, linked controls, and full-chain context.',
    type: 'website',
    url: `${siteUrl}/prove`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prove Compliance | FormaOS',
    description:
      'Generate defensible audit proof with traceable evidence, linked controls, and full-chain context.',
  },
};

export default function ProvePage() {
  return (
    <OutcomeJourneyPage
      badge="Outcome Journey · Prove"
      title="Prove Compliance With Defensible Evidence, Not Last-Minute Documents"
      description="Build an evidence chain that links obligations, controls, owners, and outcomes so audits move from panic to confidence."
      proofLabel="Proof signal"
      proofValue="Audit-ready exports"
      proofNote="Made for teams that need source-linked evidence before audits, customer reviews, procurement checks, and regulator requests."
      workflow={[
        'Collect evidence at execution time',
        'Attach controls and owner accountability',
        'Review exceptions and approvals',
        'Export audit-ready proof packages',
      ]}
      pillarsEyebrow="Prove In FormaOS"
      pillarsTitle="Make defensible evidence part of the operating flow"
      pillarsDescription="Prove connects execution history, approvals, and export paths so review cycles start from live records instead of last-minute assembly."
      pillars={[
        {
          title: 'Evidence vault',
          detail:
            'Keep artifacts, approvals, and control linkage in one place with history that remains reviewable over time.',
          href: '/product',
          cta: 'Inspect the product overview',
        },
        {
          title: 'Trust packet support',
          detail:
            'Move from platform usage to buyer review with a trust center path that surfaces the right materials early.',
          href: '/trust/packet',
          cta: 'Open the trust packet',
        },
        {
          title: 'Security review readiness',
          detail:
            'Support due diligence with clearer answers about identity, exports, hosting posture, and review artifacts.',
          href: '/security-review',
          cta: 'Review security materials',
        },
      ]}
      trustArtifacts={[
        'Source-linked evidence',
        'Approval history',
        'Exportable bundles',
        'Review packet support',
      ]}
      outcomes={[
        'Reduce audit prep from periodic reconstruction to operational exports.',
        'Give reviewers context-rich, source-linked evidence early in the process.',
        'Prevent version drift and lost evidence across departments.',
        'Increase executive confidence in external compliance narratives.',
      ]}
      journeyKey="prove"
    />
  );
}
