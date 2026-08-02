import type { Metadata } from 'next';
import { StoryHero, StoryContent } from './StoryPageContentNew';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Our Story | FormaOS',
  description:
    'Why FormaOS exists, written by the engineer building it: a first project in compliance infrastructure, worked on from Adelaide since 2022.',
  alternates: {
    canonical: `${siteUrl}/our-story`,
  },
  openGraph: {
    title: 'Our Story | FormaOS',
    description:
      'Founder-led story of how FormaOS was built for regulated teams and audit-ready operations.',
    type: 'article',
    url: `${siteUrl}/our-story`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Story | FormaOS',
    description:
      'Why FormaOS exists, written by the engineer building it: a first project in compliance infrastructure, worked on from Adelaide since 2022.',
  },
};

export default function OurStoryPage() {
  return (
    <MarketingPageShell>
      <StoryHero />
      <StoryContent />
    </MarketingPageShell>
  );
}
