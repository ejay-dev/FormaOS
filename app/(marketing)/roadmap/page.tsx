import type { Metadata } from 'next';
import RoadmapPageContent from './RoadmapPageContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Product Roadmap - FormaOS',
  description:
    'See what we\'re building next at FormaOS. Our public roadmap covers upcoming features including multi-region data residency, additional compliance frameworks, HRIS connectors, and more.',
  alternates: {
    canonical: `${siteUrl}/roadmap`,
  },
  openGraph: {
    title: 'Product Roadmap | FormaOS',
    description:
      'Upcoming features and what\'s in progress at FormaOS — transparent product planning for compliance teams.',
    type: 'website',
    url: `${siteUrl}/roadmap`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Roadmap | FormaOS',
    description:
      'Upcoming features and what\'s in progress at FormaOS — transparent product planning for compliance teams.',
  },
};

export default function RoadmapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Roadmap', path: '/roadmap' },
            ]),
          ),
        }}
      />
      <RoadmapPageContent />
    </>
  );
}
