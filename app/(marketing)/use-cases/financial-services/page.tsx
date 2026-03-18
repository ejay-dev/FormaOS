import { Metadata } from 'next';
import FinancialServicesContent from './FinancialServicesContent';
import {
  articleSchema,
  breadcrumbSchema,
  jsonLdScript,
  organizationSchema,
  siteUrl,
  softwareApplicationSchema,
} from '@/lib/seo';

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              {
                name: 'Financial Services Compliance Operations',
                path: '/use-cases/financial-services',
              },
            ]),
            articleSchema({
              title: 'Financial Services Compliance Operations',
              description:
                'Operational compliance workflows for financial services teams managing control ownership, incidents, vendor assurance, and regulator-ready evidence.',
              url: `${siteUrl}/use-cases/financial-services`,
              datePublished: '2026-03-14',
              author: 'FormaOS Team',
            }),
            organizationSchema(),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <FinancialServicesContent />
    </>
  );
}
