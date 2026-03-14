import { Metadata } from 'next';
import GovernmentPublicSectorContent from './GovernmentPublicSectorContent';
import { siteUrl } from '@/lib/seo';

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
  return <GovernmentPublicSectorContent />;
}
