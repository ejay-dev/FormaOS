import type { Metadata } from 'next';
import AboutPageContent from './AboutPageContent';
import { breadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'About FormaOS — Our Mission for Regulated Industries',
  description:
    'Why FormaOS exists: building the compliance operating system that turns regulatory obligations into structured controls, owned actions, and immutable audit evidence.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'About | FormaOS',
    description:
      'Why FormaOS exists and how it supports regulated organizations with structured compliance operations.',
    type: 'website',
    url: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
            ])
          ),
        }}
      />
      <AboutPageContent />
    </>
  );
}
