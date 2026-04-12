import type { Metadata } from 'next';
import DocsPageContent from './DocsPageContent';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Documentation & Knowledge Base | FormaOS',
  description:
    'Comprehensive documentation for FormaOS, from getting started guides to advanced API references. Everything you need to master the compliance operating system.',
  alternates: {
    canonical: `${siteUrl}/documentation`,
  },
  openGraph: {
    title: 'Documentation & Knowledge Base | FormaOS',
    description:
      'Comprehensive documentation for FormaOS, guides, tutorials, and API references for the compliance operating system.',
    type: 'website',
    url: `${siteUrl}/documentation`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation & Knowledge Base | FormaOS',
    description:
      'Comprehensive documentation for FormaOS, guides, tutorials, and API references for the compliance operating system.',
  },
};

export default function DocumentationPage() {
  return <DocsPageContent />;
}
