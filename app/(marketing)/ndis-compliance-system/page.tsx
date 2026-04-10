import type { Metadata } from 'next';
import NdisContent from './NdisContent';
import { breadcrumbSchema, faqSchema, siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title:
    'NDIS Compliance System - Practice Standards & Quality Indicators | FormaOS',
  description:
    'Purpose-built NDIS compliance system for disability service providers. Map Practice Standards, track Quality Indicators, manage incidents, and maintain audit-ready evidence for NDIS Commission reviews.',
  alternates: { canonical: `${siteUrl}/ndis-compliance-system` },
  openGraph: {
    title: 'NDIS Compliance System | FormaOS',
    description:
      'Purpose-built compliance for NDIS providers. Map Practice Standards, track Quality Indicators, and stay audit-ready.',
    type: 'website',
    url: `${siteUrl}/ndis-compliance-system`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NDIS Compliance System | FormaOS',
    description:
      'Purpose-built compliance for NDIS providers. Map Practice Standards, track Quality Indicators, and stay audit-ready.',
  },
};

const pageFaq = [
  {
    question: 'Does FormaOS map to NDIS Practice Standards?',
    answer:
      'Yes. FormaOS maps directly to the NDIS Practice Standards and Quality Indicators, including Core Module, Supplementary Modules, and provider-specific requirements based on your registration groups.',
  },
  {
    question: 'Can FormaOS help with NDIS Commission audits?',
    answer:
      'FormaOS maintains continuous audit readiness by connecting Practice Standards to operational workflows, evidence collection, and incident management. When auditors arrive, evidence is already organized and accessible.',
  },
  {
    question: 'Does FormaOS handle NDIS incident reporting?',
    answer:
      'Yes. FormaOS provides structured incident management workflows aligned with NDIS reportable incident requirements, including timeframes, categorization, investigation, and resolution tracking.',
  },
  {
    question: 'Is FormaOS suitable for small NDIS providers?',
    answer:
      'Yes. FormaOS scales from small providers managing a few registration groups to large organizations with multiple service types and locations. The platform adapts to your operational scope.',
  },
];

export default function NdisComplianceSystemPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              {
                name: 'NDIS Compliance System',
                path: '/ndis-compliance-system',
              },
            ]),
          ]),
        }}
      />
      <NdisContent />
    </>
  );
}
