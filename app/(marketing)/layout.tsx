import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OAuthRedirectWrapper } from './components/oauth-redirect-wrapper';
import { NavLinks } from './components/NavLinks';
import { MobileNav } from './components/MobileNav';
import { HeaderCTA } from './components/HeaderCTA';
import { Footer } from './components/Footer';
import './marketing.css';
import { brand } from '@/config/brand';

// Force static rendering for all marketing pages
export const dynamic = 'force-static';

export const metadata: Metadata = {
  metadataBase: new URL(brand.seo.siteUrl),
  title: {
    default: brand.seo.defaultTitle,
    template: `%s — ${brand.appName}`,
  },
  description: brand.seo.description,
  openGraph: {
    title: brand.seo.defaultTitle,
    description: brand.seo.description,
    url: brand.seo.siteUrl,
    siteName: brand.appName,
    images: [brand.seo.ogImage || brand.logo.wordmarkDark],
    type: 'website',
  },
  icons: {
    icon: [{ url: brand.logo.favicon }],
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const siteUrl = brand.seo.siteUrl;

  return (
    <div className="mk-shell font-[var(--font-body)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Premium header with glass effect and micro-animations */}
        <header className="mk-header-premium sticky top-0 z-50">
          {/* Top accent line with gradient animation */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            {/* Logo: mark + text (avoids stale wordmark asset caches) */}
            <Link
              href="/"
              className="mk-logo-container flex items-center gap-2 group"
            >
              <img
                src={brand.logo.mark}
                alt={brand.appName}
                width={32}
                height={32}
                className="select-none rounded-md"
              />
              <span className="text-[17px] sm:text-[18px] font-bold tracking-tight">
                {brand.appName}
              </span>
            </Link>

            {/* Desktop nav with animated underlines */}
            <NavLinks variant="desktop" />

            {/* Mobile menu */}
            <MobileNav />

            {/* CTA buttons with premium effects */}
            <HeaderCTA />
          </div>
        </header>

        <main className="relative z-10">{children}</main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'FormaOS',
                url: siteUrl,
                contactPoint: [
                  {
                    '@type': 'ContactPoint',
                    contactType: 'sales',
                    email: `sales@${brand.domain}`,
                  },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'FormaOS',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                url: siteUrl,
                description:
                  'Compliance and governance operating system for regulated industries.',
              },
            ]),
          }}
        />

        {/* Premium animated footer */}
        <Footer />
      </div>
    </div>
  );
}
