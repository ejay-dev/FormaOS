import type { Metadata } from 'next';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';
import { HeroStaticShell } from './components/HeroStaticShell';
import { HomeProofStaticShell } from './components/HomeProofStaticShell';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Compliance Operating System for Regulated Teams | FormaOS',
  description:
    'FormaOS turns obligations into governed workflows, owned evidence, and enterprise-ready assurance for regulated teams.',
  alternates: {
    canonical: `${siteUrl.replace(/\/$/, '')}/`,
  },
  openGraph: {
    title: 'Compliance Operating System for Regulated Teams | FormaOS',
    description:
      'FormaOS turns obligations into governed workflows, owned evidence, and enterprise-ready assurance for regulated teams.',
    type: 'website',
    url: `${siteUrl.replace(/\/$/, '')}/`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance Operating System for Regulated Teams | FormaOS',
    description:
      'FormaOS turns obligations into governed workflows, owned evidence, and enterprise-ready assurance for regulated teams.',
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <HomeClientMarker />

      {/* Server-rendered hero: copy is in the initial HTML for crawlers and LCP */}
      <HeroStaticShell />
      <HomeProofStaticShell />

      {/* Client sections: animations, control-plane overrides, below-fold content */}
      <FigmaHomepage skipHero />
    </div>
  );
}
