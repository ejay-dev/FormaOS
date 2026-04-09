import type { Metadata } from 'next';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';
import { HeroStaticShell } from './components/HeroStaticShell';
import { HomeProofStaticShell } from './components/HomeProofStaticShell';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'FormaOS — Compliance Operating System for Australian Regulated Industries',
  description:
    'FormaOS turns regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance. NDIS, Healthcare, Financial Services, Childcare, Construction.',
  keywords: [
    'compliance software Australia',
    'compliance operating system',
    'NDIS compliance',
    'healthcare compliance',
    'ASIC compliance',
    'regulated industries Australia',
  ],
  authors: [{ name: 'FormaOS' }],
  creator: 'FormaOS',
  publisher: 'FormaOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/`,
    siteName: 'FormaOS',
    title:
      'FormaOS — Compliance Operating System for Australian Regulated Industries',
    description:
      'Turn regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance across NDIS, Healthcare, Financial Services, Childcare, and Construction.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS — Compliance Operating System for Australian Regulated Industries',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'FormaOS — Compliance Operating System for Australian Regulated Industries',
    description:
      'Turn regulatory obligations into governed workflows with named owners, immutable evidence chains, and audit-ready assurance. NDIS, Healthcare, Financial Services, Childcare, Construction.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
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
