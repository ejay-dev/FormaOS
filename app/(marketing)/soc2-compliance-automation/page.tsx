import type { Metadata } from 'next';
import Soc2Content from './Soc2Content';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'SOC 2 Compliance Automation — Trust Service Criteria Platform | FormaOS',
  description:
    'Automate SOC 2 compliance with FormaOS. Map Trust Service Criteria to operational controls, capture evidence continuously, and streamline Type II audit readiness.',
  alternates: { canonical: `${siteUrl}/soc2-compliance-automation` },
  openGraph: {
    title: 'SOC 2 Compliance Automation | FormaOS',
    description:
      'Automate SOC 2 compliance. Map Trust Service Criteria, capture evidence, and stay audit-ready with FormaOS.',
    type: 'website',
    url: `${siteUrl}/soc2-compliance-automation`,
  },
};

const pageFaq = [
  { question: 'Does FormaOS support SOC 2 Type II?', answer: 'Yes. FormaOS is designed for continuous compliance, which aligns directly with the SOC 2 Type II requirement to demonstrate controls operating effectively over a period of time, not just at a point in time.' },
  { question: 'Which Trust Service Criteria does FormaOS cover?', answer: 'FormaOS supports all five Trust Service Criteria: Security (Common Criteria), Availability, Processing Integrity, Confidentiality, and Privacy. Controls can be mapped across one or multiple criteria.' },
  { question: 'Can FormaOS generate auditor-ready evidence packages?', answer: 'Yes. FormaOS generates exportable evidence packages that map directly to TSC requirements, including control descriptions, testing results, and exception tracking with timestamps and attribution.' },
];

export default function Soc2ComplianceAutomationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'SOC 2 Compliance Automation', path: '/soc2-compliance-automation' },
            ]),
          ]),
        }}
      />
      <Soc2Content />
    </>
  );
}
