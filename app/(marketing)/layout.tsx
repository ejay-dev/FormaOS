import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OAuthRedirectWrapper } from './components/oauth-redirect-wrapper';
import { NavLinks } from './components/NavLinks';
import { MobileNav } from './components/MobileNav';
import { HeaderCTA } from './components/HeaderCTA';
import { Footer } from './components/Footer';
import { SystemStateHydrator } from '@/lib/system-state/hydrator';
import { PublicAuthProvider } from '@/lib/auth/public-auth-provider';
import './marketing.css';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';

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
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: brand.seo.siteUrl,
    siteName: 'FormaOS',
    title: 'FormaOS | Compliance Operating System',
    description:
      'FormaOS is the compliance operating system for regulated industries. Manage frameworks, policies, controls, and evidence in a single platform.',
    images: [
      {
        url: `${brand.seo.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS',
      },
    ],
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const siteUrl = brand.seo.siteUrl;

  return (
    <div className="mk-shell font-[var(--font-body)]">
      {/* Add PublicAuthProvider for lightweight auth context */}
      <PublicAuthProvider>
        {/* Add SystemStateHydrator with publicRoute flag */}
        <SystemStateHydrator publicRoute={true}>
          {/* Add OAuthRedirectWrapper to handle OAuth redirects */}
          <OAuthRedirectWrapper />
          <div className="relative min-h-screen overflow-hidden">
            {/* Premium header with glass effect and micro-animations */}
            <header className="mk-header-premium sticky top-0 z-50">
              {/* Top accent line with gradient animation */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  {/* Logo */}
                  <div className="flex items-center">
                    <Link
                      href="/"
                      className="flex items-center text-foreground"
                    >
                      <Logo size={32} />
                    </Link>
                  </div>

                  {/* Desktop Navigation */}
                  <NavLinks />

                  {/* Mobile Navigation */}
                  <MobileNav />

                  {/* CTA Buttons */}
                  <HeaderCTA />
                </div>
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
        </SystemStateHydrator>
      </PublicAuthProvider>
    </div>
  );
}
