import { Metadata } from 'next';
import GovernmentPublicSectorContent from './GovernmentPublicSectorContent';
import {
  articleSchema,
  breadcrumbSchema,
  jsonLdScript,
  organizationSchema,
  siteUrl,
  softwareApplicationSchema,
} from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Government & Public Sector Governance | FormaOS',
  description:
    'Operational governance workflows for government and public sector teams managing approvals, evidence, records, and defensible accountability.',
  alternates: { canonical: `${siteUrl}/use-cases/government-public-sector` },
  openGraph: {
    title: 'Government & Public Sector Governance | FormaOS',
    description:
      'Operational governance workflows for government and public sector teams managing approvals, evidence, records, and defensible accountability.',
    type: 'website',
    url: `${siteUrl}/use-cases/government-public-sector`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Government & Public Sector Governance | FormaOS',
    description:
      'Approvals, records, evidence, and defensible accountability workflows for government and public sector teams.',
  },
};

export default function GovernmentPublicSectorUseCasePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              {
                name: 'Government & Public Sector Governance',
                path: '/use-cases/government-public-sector',
              },
            ]),
            articleSchema({
              title: 'Government & Public Sector Governance',
              description:
                'Operational governance workflows for government and public sector teams managing approvals, evidence, records, and defensible accountability.',
              url: `${siteUrl}/use-cases/government-public-sector`,
              datePublished: '2026-03-14',
              author: 'FormaOS Team',
            }),
            organizationSchema(),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <GovernmentPublicSectorContent />
    </>
  );
}
