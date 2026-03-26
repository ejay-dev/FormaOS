import type { Metadata } from 'next';
import FeaturesPageContent from './FeaturesPageContent';
import { breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Platform Features - FormaOS',
  description:
    'Every feature inside FormaOS: framework packs, compliance gate enforcement, SHA-256 evidence verification, workflow automation, risk heatmaps, and more.',
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: 'Platform Features | FormaOS',
    description:
      'Explore 18 core features across compliance operations, workflow automation, enterprise security, and team collaboration.',
    type: 'website',
    url: `${siteUrl}/features`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Features | FormaOS',
    description:
      'Explore 18 core features across compliance operations, workflow automation, enterprise security, and team collaboration.',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Features', path: '/features' },
            ]),
          ),
        }}
      />
      <FeaturesPageContent />
    </>
  );
}
