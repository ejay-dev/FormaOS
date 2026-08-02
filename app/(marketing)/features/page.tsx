import type { Metadata } from 'next';
import FeaturesPageContent, { FEATURE_COUNT } from './FeaturesPageContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

const socialDescription = `Explore ${FEATURE_COUNT} core features across compliance operations, workflow automation, identity and security, collaboration, and AI and certification.`;

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Platform Features - FormaOS',
  description: `${FEATURE_COUNT} features across framework packs, evidence verification, workflow automation, risk heatmaps, cross-mapping, and the integration marketplace.`,
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: 'Platform Features | FormaOS',
    description: socialDescription,
    type: 'website',
    url: `${siteUrl}/features`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Features | FormaOS',
    description: socialDescription,
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
