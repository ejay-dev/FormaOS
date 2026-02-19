import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OAuthRedirectWrapper } from './components/oauth-redirect-wrapper';
import { NavLinks } from './components/NavLinks';
import { MobileNav } from './components/MobileNav';
import { HeaderCTA } from './components/HeaderCTA';
import { Footer } from './components/Footer';
import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';
import './marketing.css';
import './design-system.css';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import MarketingBackgroundLayer from '@/components/motion/MarketingBackgroundLayer';
import { PageTransition } from '@/components/motion/PageTransition';

// Force static rendering for all marketing pages
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: {
    default: 'FormaOS | Compliance Operating System',
    template: '%s | FormaOS',
  },
  description:
    'FormaOS is the compliance operating system for regulated industries. Manage frameworks, policies, controls, and evidence in a single platform.',
  metadataBase: new URL(brand.seo.siteUrl),
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const siteUrl = brand.seo.siteUrl;

  return (
    <div className="mk-shell font-[var(--font-body)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] mk-btn mk-btn-secondary px-4 py-2"
      >
        Skip to main content
      </a>
      {/* Add OAuthRedirectWrapper to handle OAuth redirects */}
      <OAuthRedirectWrapper />
      <div className="relative min-h-screen overflow-hidden">
        {/* Shared background layer: gradient + grid + grain + vignette */}
        <MarketingBackgroundLayer />

        {/* Premium header with glass effect and micro-animations */}
        <header className="mk-header-premium sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-[68px] sm:h-[72px] lg:h-[76px] items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              {/* Logo */}
              <div className="flex shrink-0 items-center">
                <Link
                  href="/"
                  className="flex items-center text-white transition-opacity hover:opacity-90"
                >
                  <Logo variant="mark" size={42} />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <NavLinks />

              {/* Separator + CTA */}
              <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
                <div className="mk-nav-divider" aria-hidden="true" />
                <HeaderCTA />
              </div>

              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </div>
        </header>

        {/* Scrolled state for header glass enhancement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.querySelector('.mk-header-premium');if(!h)return;var c='scrolled';function u(){h.classList.toggle(c,window.scrollY>10)}window.addEventListener('scroll',u,{passive:true});u()})()`,
          }}
        />

        <EnterpriseTrustStrip surface="marketing" />

        <main id="main-content" className="relative z-10 mk-page-bg">
          <PageTransition>{children}</PageTransition>
        </main>
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
