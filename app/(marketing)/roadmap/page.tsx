import type { Metadata } from 'next';
import RoadmapPageContent from './RoadmapPageContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Product Roadmap - FormaOS',
  description:
    'Public roadmap for FormaOS: multi-region data residency, additional framework packs, HRIS connectors, and more shipping in the next quarters.',
  alternates: {
    canonical: `${siteUrl}/roadmap`,
  },
  openGraph: {
    title: 'Product Roadmap | FormaOS',
    description:
      'Upcoming features and what\'s in progress at FormaOS - transparent product planning for compliance teams.',
    type: 'website',
    url: `${siteUrl}/roadmap`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Roadmap | FormaOS',
    description:
      'Upcoming features and what\'s in progress at FormaOS - transparent product planning for compliance teams.',
  },
};

export default function RoadmapPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Roadmap', path: '/roadmap' },
            ])} />
      <RoadmapPageContent />
    </>
  );
}
