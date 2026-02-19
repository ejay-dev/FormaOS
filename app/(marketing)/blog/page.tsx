import type { Metadata } from 'next';
import BlogPageContent from './BlogPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Blog & Insights | FormaOS',
  description:
    'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries. Stay informed with the latest from FormaOS.',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Blog & Insights | FormaOS',
    description:
      'Expert insights on compliance management, regulatory technology, and operational excellence for regulated industries.',
    type: 'website',
    url: `${siteUrl}/blog`,
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}
