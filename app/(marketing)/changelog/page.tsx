import type { Metadata } from 'next';
import ChangelogPageContent from './ChangelogPageContent';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Changelog - FormaOS',
  description:
    'Stay up to date with the latest improvements, new features, and fixes shipped by the FormaOS team.',
  alternates: { canonical: `${siteUrl}/changelog` },
  openGraph: {
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
    type: 'website',
    url: `${siteUrl}/changelog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
  },
};

export default function ChangelogPage() {
  return <ChangelogPageContent />;
}
