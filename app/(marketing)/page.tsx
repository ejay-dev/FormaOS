import type { Metadata } from 'next';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';
import { HeroStaticShell } from './components/HeroStaticShell';
import { HomeProofStaticShell } from './components/HomeProofStaticShell';
import { AuditChainSection } from './components/homepage/AuditChainSection';
import { HowItWorks } from '@/components/HowItWorks';
import { TrustBar } from '@/components/TrustBar';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title:
    'Compliance Operating System for Regulated Industries',
  description:
    'Turn regulatory obligations into enforced workflows with named owners, immutable evidence chains, and audit-ready assurance. NDIS, healthcare, finance.',
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
      'Compliance Operating System for Regulated Industries',
    description:
      'Turn regulatory obligations into enforced workflows with named owners, immutable evidence chains, and audit-ready assurance. NDIS, healthcare, finance.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Compliance Operating System for Regulated Industries',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Compliance Operating System for Regulated Industries',
    description:
      'Turn regulatory obligations into enforced workflows with named owners, immutable evidence chains, and audit-ready assurance. NDIS, healthcare, finance.',
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <HomeClientMarker />

      {/* Server-rendered: hero, framework trust, buyer paths, the operating
          loop and the cryptographic proof are all in the initial HTML, so
          crawlers and no-JS visitors get the argument without running JS. */}
      <HeroStaticShell />
      <TrustBar />
      <HomeProofStaticShell />
      <HowItWorks />
      <AuditChainSection />

      {/* Client sections: the demo, industries, scenarios and closing CTA */}
      <FigmaHomepage skipHero />
    </div>
  );
}
