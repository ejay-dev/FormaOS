import type { Metadata } from 'next';
import FeaturesPageContent from './FeaturesPageContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Platform Features - FormaOS',
  description:
    '25 features across framework packs, evidence verification, workflow automation, risk heatmaps, cross-mapping, and the integration marketplace.',
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: 'Platform Features | FormaOS',
    description:
      'Explore 25 core features across compliance operations, workflow automation, identity & security, collaboration, and AI & certification.',
    type: 'website',
    url: `${siteUrl}/features`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Features | FormaOS',
    description:
      'Explore 25 core features across compliance operations, workflow automation, identity & security, collaboration, and AI & certification.',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Features', path: '/features' },
            ])} />
      <FeaturesPageContent />
    </>
  );
}
