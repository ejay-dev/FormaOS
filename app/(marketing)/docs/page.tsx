import type { Metadata } from 'next';
import DocsPageContent from './DocsPageContent';

export const metadata: Metadata = {
  title: 'Documentation & Knowledge Base | FormaOS',
  description:
    'Comprehensive documentation for FormaOS, from getting started guides to advanced API references. Everything you need to master the compliance operating system.',
  openGraph: {
    title: 'Documentation & Knowledge Base | FormaOS',
    description:
      'Comprehensive documentation for FormaOS, guides, tutorials, and API references for the compliance operating system.',
    type: 'website',
    url: 'https://formaos.com/docs',
  },
};

export default function DocsPage() {
  return <DocsPageContent />;
}
