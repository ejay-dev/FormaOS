import type { Metadata } from 'next';
import { MarketingAnchor } from './components/marketing-anchor';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Turn Process Into Provable Truth',
  description:
    'Model workflows. Execute with precision. Verify in real-time. Prove compliance. Enterprise-grade process evidence platform for regulated industries.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'FormaOS | Turn Process Into Provable Truth',
    description:
      'Enterprise-grade process evidence platform for regulated industries. Model workflows, execute with precision, verify in real-time, prove compliance.',
    type: 'website',
    url: siteUrl,
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c] overflow-x-hidden">
      <HomeClientMarker />

      {/* New Figma-based design implementation */}
      <FigmaHomepage />
    </div>
  );
}
