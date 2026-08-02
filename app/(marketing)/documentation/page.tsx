import type { Metadata } from 'next';
import DocsPageContent from './DocsPageContent';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Documentation | FormaOS',
  description:
    'Index of FormaOS documentation: the v1 REST API reference, security and data-handling documents, procurement material, and operational pages.',
  alternates: {
    canonical: `${siteUrl}/documentation`,
  },
  openGraph: {
    title: 'Documentation | FormaOS',
    description:
      'Index of FormaOS documentation: the v1 REST API reference, security and data-handling documents, procurement material, and operational pages.',
    type: 'website',
    url: `${siteUrl}/documentation`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation | FormaOS',
    description:
      'Index of FormaOS documentation: API reference, security and data handling, procurement material, and operational pages.',
  },
};

export default function DocumentationPage() {
  return <DocsPageContent />;
}
