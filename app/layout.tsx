import type { Metadata, Viewport } from 'next';
import { Inter, Sora, JetBrains_Mono, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import CookieConsent from '@/components/CookieConsent';
import NextTopLoader from 'nextjs-toploader';
import { ObservabilityProvider } from '@/components/observability/ObservabilityProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
  weight: ['600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  weight: ['400', '500', '700'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  preload: false,
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
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
  themeColor: '#0F172A',
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
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
    >
      <body className={inter.className}>
        <NextTopLoader color="#22d3ee" height={2} showSpinner={false} />
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
