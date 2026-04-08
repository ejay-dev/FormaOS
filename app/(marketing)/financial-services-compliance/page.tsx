import type { Metadata } from 'next';
import FinancialServicesContent from './FinancialServicesContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Financial Services Compliance Software Australia | FormaOS',
  description: 'ASIC AFS licence obligation mapping, APRA CPS 230 compliance, AUSTRAC AML/CTF tracking, and breach register management. Built for Australian financial services.',
  keywords: ['ASIC compliance software', 'AFS licence obligations', 'AUSTRAC AML/CTF', 'APRA CPS 230', 'breach register', 'financial services compliance Australia'],
  alternates: { canonical: `${siteUrl}/financial-services-compliance` },
  openGraph: {
    title: 'Financial Services Compliance Software Australia | FormaOS',
    description: 'ASIC, APRA, and AUSTRAC compliance in one platform. Obligation mapping, breach registers, and board reporting for AFS licensees.',
    url: 'https://formaos.com.au/financial-services-compliance',
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function FinancialServicesCompliancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Industries', path: '/industries' }, { name: 'Financial Services Compliance', path: '/financial-services-compliance' }])) }} />
      <FinancialServicesContent />
    </>
  );
}
