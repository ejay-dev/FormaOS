import type { Metadata } from 'next';
import AboutPageContent from './AboutPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | About',
  description:
    'Why FormaOS exists and how it supports regulated organizations.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'FormaOS | About',
    description:
      'Why FormaOS exists and how it supports regulated organizations.',
    type: 'website',
    url: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
