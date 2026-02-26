import type { Metadata } from 'next';
import IsoContent from './IsoContent';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'ISO Compliance Software — ISO 27001 Automation Platform | FormaOS',
  description:
    'Automate ISO 27001 compliance with FormaOS. Map controls to Annex A requirements, capture evidence continuously, and maintain audit-ready documentation year-round.',
  alternates: { canonical: `${siteUrl}/iso-compliance-software` },
  openGraph: {
    title: 'ISO Compliance Software | FormaOS',
    description:
      'Automate ISO 27001 compliance. Map controls, capture evidence, and stay audit-ready with FormaOS.',
    type: 'website',
    url: `${siteUrl}/iso-compliance-software`,
  },
};

const pageFaq = [
  { question: 'Does FormaOS support ISO 27001:2022?', answer: 'Yes. FormaOS maps controls directly to Annex A requirements from the 2022 revision, including the new organizational, people, physical, and technological control categories.' },
  { question: 'Can FormaOS help with ISO certification?', answer: 'FormaOS provides the operational infrastructure to maintain continuous compliance — control ownership, evidence capture, and audit trail generation — that auditors require during certification and surveillance audits.' },
  { question: 'How does FormaOS handle the Statement of Applicability?', answer: 'FormaOS lets you define which Annex A controls are applicable, map them to internal policies and controls, and track evidence against each. This creates a living Statement of Applicability backed by real operational data.' },
  { question: 'Can we manage multiple ISO frameworks simultaneously?', answer: 'Yes. FormaOS is framework-agnostic. You can manage ISO 27001, ISO 9001, ISO 45001, and other frameworks concurrently with shared controls and unified evidence collection.' },
];

export default function IsoComplianceSoftwarePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'ISO Compliance Software', path: '/iso-compliance-software' },
            ]),
          ]),
        }}
      />
      <IsoContent />
    </>
  );
}
