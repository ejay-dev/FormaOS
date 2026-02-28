import type { Metadata } from 'next';
import { HomeClientMarker } from './components/home-client-marker';
import FigmaHomepage from './components/FigmaHomepage';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Turn Process Into Provable Truth',
  description:
    'Model workflows. Execute with precision. Verify in real-time. Prove compliance. Enterprise-grade process evidence platform for regulated industries.',
  alternates: {
    canonical: `${siteUrl.replace(/\/$/, '')}/`,
  },
  openGraph: {
    title: 'FormaOS | Turn Process Into Provable Truth',
    description:
      'Enterprise-grade process evidence platform for regulated industries. Model workflows, execute with precision, verify in real-time, prove compliance.',
    type: 'website',
    url: `${siteUrl.replace(/\/$/, '')}/`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Turn Process Into Provable Truth',
    description:
      'Enterprise-grade process evidence platform for regulated industries. Model workflows, execute with precision, verify in real-time, prove compliance.',
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <HomeClientMarker />

      {/* New Figma-based design implementation */}
      <FigmaHomepage />
    </div>
  );
}
