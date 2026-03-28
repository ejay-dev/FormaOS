import type { Metadata } from 'next';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';
import { HeroStaticShell } from './components/HeroStaticShell';
import { HomeProofStaticShell } from './components/HomeProofStaticShell';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS — Compliance That Runs Itself',
  description:
    'FormaOS turns regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance across every framework your team operates under.',
  alternates: {
    canonical: `${siteUrl.replace(/\/$/, '')}/`,
  },
  openGraph: {
    title: 'FormaOS — Compliance That Runs Itself',
    description:
      'FormaOS turns regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance across every framework your team operates under.',
    type: 'website',
    url: `${siteUrl.replace(/\/$/, '')}/`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS — Compliance That Runs Itself',
    description:
      'FormaOS turns regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance across every framework your team operates under.',
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
