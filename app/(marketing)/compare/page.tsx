import type { Metadata } from 'next';
import CompareIndexContent from './CompareIndexContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Compare FormaOS vs AU Compliance Platforms',
  description:
    'Compare FormaOS to HealthMetrics, CompliSpace, Riskware, and 6clicks across pricing, frameworks, evidence integrity, and audit-readiness.',
  alternates: {
    canonical: `${siteUrl}/compare`,
  },
  openGraph: {
    title: 'Compare FormaOS vs Compliance Tools',
    description:
      'Compare FormaOS against popular compliance automation tools. Outcome-driven execution, evidence defensibility, and operational governance.',
    type: 'website',
    url: `${siteUrl}/compare`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare FormaOS vs AU Compliance Platforms',
    description:
      'See how FormaOS compares against Ideagen Policy Logic, Riskware, 6clicks, and HealthMetrics. Operational execution beats traditional GRC for AU care.',
  },
};

export default function CompareIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
            ])} />
      <CompareIndexContent />
    </>
  );
}
