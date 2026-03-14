import { Metadata } from 'next';
import FinancialServicesContent from './FinancialServicesContent';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Financial Services Compliance Operations | FormaOS',
  description:
    'Operational compliance workflows for financial services teams managing control ownership, incidents, vendor assurance, and regulator-ready evidence.',
  alternates: { canonical: `${siteUrl}/use-cases/financial-services` },
  openGraph: {
    title: 'Financial Services Compliance Operations | FormaOS',
    description:
      'Operational compliance workflows for financial services teams managing control ownership, incidents, vendor assurance, and regulator-ready evidence.',
    type: 'website',
    url: `${siteUrl}/use-cases/financial-services`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial Services Compliance Operations | FormaOS',
    description:
      'Control ownership, incident workflows, vendor assurance, and regulator-ready evidence for financial services teams.',
  },
};

export default function FinancialServicesUseCasePage() {
  return <FinancialServicesContent />;
}
