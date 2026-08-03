import type { Metadata, Viewport } from 'next';
import {
  Hanken_Grotesk,
  Bricolage_Grotesque,
  Fraunces,
  JetBrains_Mono,
} from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import CookieConsent from '@/components/CookieConsent';
import NextTopLoader from 'nextjs-toploader';
import { ObservabilityProvider } from '@/components/observability/ObservabilityProvider';
import './globals.css';

const bodyFont = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
  weight: ['600', '700', '800'],
  // size-adjust fallback metrics so the H1 doesn't reflow on font swap (CLS/LCP)
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

// Editorial accent for a single emphasised word in a marketing headline.
// Not loaded on the app shell path in practice — preload is off and only
// .mk-accent references it, so pages that never use it pay nothing.
const accentFont = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-accent',
  preload: false,
  style: ['italic'],
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  weight: ['400', '500', '700'],
});

const metadataBase = (() => {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://www.formaos.com.au';
  try {
    return new URL(base);
  } catch {
    return new URL('https://www.formaos.com.au');
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'FormaOS | Compliance Operating System',
    template: '%s | FormaOS',
  },
  description:
    'FormaOS is the compliance operating system for regulated industries. Manage frameworks, policies, controls, and evidence in a single platform.',
  verification: {
    // GSC ownership verified via DNS (domain property covers all subdomains)
    other: {
      'msvalidate.01': 'CCE491B55A86CC8370EAF532D11BA68C',
    },
  },
  other: {
    // Legacy Apple-prefixed name kept alongside Next.js's modern
    // `mobile-web-app-capable` so iOS < 16.4 still treats Add-to-Home-Screen
    // launches as standalone.
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'FormaOS',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'FormaOS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FormaOS — Compliance Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@FormaOS',
    creator: '@FormaOS',
    title: 'FormaOS | Compliance Operating System',
    description:
      'FormaOS is the compliance operating system for regulated industries. Manage frameworks, policies, controls, and evidence in a single platform.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  // Matches public/manifest.json theme_color. These disagreed (slate navy
  // here, brand charcoal there), so the browser chrome tinted a different
  // colour than the installed app.
  themeColor: '#1C1E1F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable} ${accentFont.variable} ${jetbrainsMono.variable}`}
    >
      <body className={bodyFont.className}>
        {/* v4-029: actual Skip-to-main link. The prior comment
            claimed one existed but the element was never rendered,
            so keyboard users had no way to bypass the global nav
            and CookieConsent on every page (WCAG 2.4.1 fail). The
            link is visually hidden until focused, then anchors to
            #main-content — every page-level layout (marketing/app/
            admin) provides that target via its <main id> element. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg focus:outline focus:outline-2 focus:outline-emerald-500"
        >
          Skip to main content
        </a>
        <NextTopLoader color="#71717a" height={2} showSpinner={false} />
        <ObservabilityProvider />
        {/* Mount CookieConsent BEFORE {children} so DOM tab order
            places it immediately after Skip-to-main on every page.
            Visually it stays pinned at bottom via position:fixed; the
            DOM-vs-visual divergence is what fixes WCAG 2.4.3 — the
            keyboard user can resolve the banner in one keystroke
            instead of tabbing past 50 page links. */}
        <CookieConsent />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
