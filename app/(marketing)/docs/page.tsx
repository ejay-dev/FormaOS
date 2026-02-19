import type { Metadata } from 'next';
import DocsPageContent from './DocsPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Documentation & Knowledge Base | FormaOS',
  description:
    'Comprehensive documentation for FormaOS, from getting started guides to advanced API references. Everything you need to master the compliance operating system.',
  alternates: {
    canonical: `${siteUrl}/docs`,
  },
  openGraph: {
    title: 'Documentation & Knowledge Base | FormaOS',
    description:
      'Comprehensive documentation for FormaOS, guides, tutorials, and API references for the compliance operating system.',
    type: 'website',
    url: `${siteUrl}/docs`,
  },
};

export default function DocsPage() {
  return <DocsPageContent />;
}
