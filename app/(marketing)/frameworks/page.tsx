import type { Metadata } from 'next';
import FrameworksContent from './FrameworksContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'ISO, SOC 2, NDIS Framework Coverage - FormaOS',
  description:
    'Framework-mapped controls and evidence workflows for ISO 27001, SOC 2, NDIS Practice Standards, and more. Repeatable execution, not checklists.',
  alternates: {
    canonical: `${siteUrl}/frameworks`,
  },
  openGraph: {
    title: 'Framework Coverage | FormaOS',
    description:
      'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
    type: 'website',
    url: `${siteUrl}/frameworks`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ISO, SOC 2, NDIS Framework Coverage - FormaOS',
    description:
      'Framework-mapped controls and evidence workflows for ISO 27001, SOC 2, NDIS Practice Standards, and more.',
  },
};

export default function FrameworksPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Frameworks', path: '/frameworks' },
            ])} />
      <FrameworksContent />
    </>
  );
}
