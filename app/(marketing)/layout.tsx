import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OAuthRedirectWrapper } from './components/oauth-redirect-wrapper';
import { NavLinks } from './components/NavLinks';
import { MobileNav } from './components/MobileNav';
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
            <div className="hidden md:flex items-center gap-2 lg:gap-3 text-[14px] lg:text-[15px]">
              <Link
                href="/auth/signin"
                className="btn btn-ghost px-3 lg:px-4 py-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                className="btn btn-secondary px-3 lg:px-4 py-2"
              >
                Plans
              </Link>
              <Link
                href="/auth/signup"
                className="btn btn-primary px-4 lg:px-5 py-2 shadow-[0_0_20px_rgba(0,212,251,0.3)] hover:shadow-[0_0_30px_rgba(0,212,251,0.4)] transition-shadow"
              >
                Start Free
              </Link>
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

        {/* Premium footer with node-wire background effects */}
        <footer className="mk-footer-premium relative overflow-hidden">
          {/* Animated gradient meshes */}
          <div className="mk-gradient-mesh" />

          {/* Constellation overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <radialGradient id="footerNodeGlow">
                  <stop
                    offset="0%"
                    stopColor="rgb(56, 189, 248)"
                    stopOpacity="0.6"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(56, 189, 248)"
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>
              {/* Decorative nodes */}
              <circle
                cx="10%"
                cy="30%"
                r="2"
                fill="rgb(56, 189, 248)"
                opacity="0.4"
              />
              <circle
                cx="25%"
                cy="60%"
                r="1.5"
                fill="rgb(139, 92, 246)"
                opacity="0.3"
              />
              <circle
                cx="75%"
                cy="25%"
                r="2"
                fill="rgb(6, 182, 212)"
                opacity="0.4"
              />
              <circle
                cx="90%"
                cy="70%"
                r="1.5"
                fill="rgb(56, 189, 248)"
                opacity="0.3"
              />
              {/* Connecting lines */}
              <line
                x1="10%"
                y1="30%"
                x2="25%"
                y2="60%"
                stroke="rgb(56, 189, 248)"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
              <line
                x1="75%"
                y1="25%"
                x2="90%"
                y2="70%"
                stroke="rgb(139, 92, 246)"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
            </svg>
          </div>

          <div className="relative border-t border-white/8 glass-panel-elite backdrop-blur-xl">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {/* Brand column */}
              <div className="col-span-2 md:col-span-1 space-y-5">
                <div className="flex items-center gap-2">
                  <img
                    src={brand.logo.mark}
                    alt={brand.appName}
                    width={28}
                    height={28}
                    className="select-none rounded-md"
                  />
                  <span className="text-[16px] font-semibold">
                    {brand.appName}
                  </span>
                </div>
                <p className="text-sm sm:text-[15px] text-foreground/70 leading-relaxed max-w-sm">
                  Compliance and governance operating system for regulated
                  organizations.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full glass-panel px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-[0.26em] font-semibold text-foreground/80">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,251,0.5)]" />{' '}
                  Audit Ready
                </div>
              </div>

              {/* Platform */}
              <div className="space-y-4 text-sm sm:text-[15px]">
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                  Platform
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Link
                    href="/product"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    How it works
                  </Link>
                  <Link
                    href="/industries"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Industries
                  </Link>
                  <Link
                    href="/security"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Security
                  </Link>
                  <Link
                    href="/pricing"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Pricing
                  </Link>
                </div>
              </div>

              {/* Company */}
              <div className="space-y-4 text-sm sm:text-[15px]">
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                  Company
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Link
                    href="/about"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    About
                  </Link>
                  <Link
                    href="/our-story"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Our Story
                  </Link>
                  <Link
                    href="/contact"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Contact
                  </Link>
                </div>
              </div>

              {/* Trust & Compliance */}
              <div className="space-y-4 text-sm sm:text-[15px]">
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                  Trust & Compliance
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Link
                    href="/security"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Security
                  </Link>
                  <Link
                    href="/legal/privacy"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="mk-footer-link text-foreground/70 block"
                  >
                    Terms
                  </Link>
                </div>
                <div className="mt-4 sm:mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-primary shadow-[0_0_4px_rgba(0,212,251,0.4)]" />{' '}
                    Immutable audit logs
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-secondary shadow-[0_0_4px_rgba(77,159,255,0.4)]" />{' '}
                    Evidence encryption
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-accent shadow-[0_0_4px_rgba(167,139,250,0.4)]" />{' '}
                    Tenant isolation
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
              <p>
                © 2026 FormaOS. Operational compliance for regulated industries.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
