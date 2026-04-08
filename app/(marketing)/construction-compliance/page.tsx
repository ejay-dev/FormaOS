import type { Metadata } from 'next';
import ConstructionComplianceContent from './ConstructionComplianceContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Construction WHS Compliance Software Australia | FormaOS',
  description:
    'WHS compliance software for Australian construction. SWMS registers, contractor induction tracking, SafeWork notification workflows, and multi-site compliance dashboards.',
  keywords: [
    'WHS compliance software',
    'SafeWork compliance',
    'construction safety management',
    'SWMS register',
    'contractor induction',
    'construction compliance Australia',
    'high risk work licence',
  ],
  alternates: { canonical: `${siteUrl}/construction-compliance` },
  openGraph: {
    title: 'Construction WHS Compliance Software Australia | FormaOS',
    description:
      'SWMS registers, contractor induction tracking, and SafeWork notification workflows for construction companies.',
    url: 'https://formaos.com.au/construction-compliance',
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function ConstructionCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              { name: 'Construction Compliance', path: '/construction-compliance' },
            ])
          ),
        }}
      />
      <ConstructionComplianceContent />
    </>
  );
}
