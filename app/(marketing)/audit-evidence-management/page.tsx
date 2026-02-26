import type { Metadata } from 'next';
import AuditEvidenceContent from './AuditEvidenceContent';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Audit Evidence Management — Immutable Evidence & Audit Trails | FormaOS',
  description:
    'Capture, organize, and export audit evidence automatically. FormaOS creates immutable audit trails tied to compliance controls, eliminating pre-audit evidence scrambles.',
  alternates: { canonical: `${siteUrl}/audit-evidence-management` },
  openGraph: {
    title: 'Audit Evidence Management | FormaOS',
    description:
      'Capture and organize audit evidence automatically. Immutable audit trails tied to compliance controls.',
    type: 'website',
    url: `${siteUrl}/audit-evidence-management`,
  },
};

const pageFaq = [
  { question: 'How does FormaOS capture audit evidence?', answer: 'Evidence is captured automatically as work happens. Every task completion, policy acknowledgment, approval, and control verification creates an immutable evidence record linked to specific compliance controls.' },
  { question: 'Is evidence in FormaOS truly immutable?', answer: 'Yes. Evidence records include cryptographic timestamps and are stored in append-only audit logs. Records cannot be modified or deleted after creation, ensuring a tamper-evident evidence chain.' },
  { question: 'Can we export evidence for external auditors?', answer: 'Yes. FormaOS generates structured evidence packages organized by framework, control, and time period. Exports are available in standard formats (CSV, ZIP) that auditors can review independently.' },
  { question: 'How does FormaOS handle evidence for multiple frameworks?', answer: 'A single piece of evidence can be linked to controls across multiple frameworks. This eliminates duplicate evidence collection when controls overlap between ISO 27001, SOC 2, NDIS, and other frameworks.' },
];

export default function AuditEvidenceManagementPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Audit Evidence Management', path: '/audit-evidence-management' },
            ]),
          ]),
        }}
      />
      <AuditEvidenceContent />
    </>
  );
}
