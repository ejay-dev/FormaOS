import type { Metadata } from 'next';
import BlogPageContent from './BlogPageContent';

export const metadata: Metadata = {
  title: 'Blog & Insights | FormaOS',
  description:
    'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries. Stay informed with the latest from FormaOS.',
  openGraph: {
    title: 'Blog & Insights | FormaOS',
    description:
      'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries.',
    type: 'website',
    url: 'https://formaos.com/blog',
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}
