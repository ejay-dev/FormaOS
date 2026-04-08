import type { Metadata } from 'next';
import ChildcareComplianceContent from './ChildcareComplianceContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Childcare Compliance Software Australia | FormaOS',
  description: 'NQF quality area tracking, educator credential management, and assessment visit readiness for Australian childcare services. ACECQA-aligned compliance software.',
  keywords: ['NQF compliance software', 'ACECQA compliance', 'childcare regulatory software', 'National Quality Framework', 'childcare quality improvement plan', 'educator credentials'],
  alternates: { canonical: `${siteUrl}/childcare-compliance` },
  openGraph: {
    title: 'Childcare Compliance Software Australia | FormaOS',
    description: 'NQF quality area tracking, educator credential management, and assessment-ready evidence packs for childcare services.',
    url: 'https://formaos.com.au/childcare-compliance',
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function ChildcareCompliancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Industries', path: '/industries' }, { name: 'Childcare Compliance', path: '/childcare-compliance' }])) }} />
      <ChildcareComplianceContent />
    </>
  );
}
