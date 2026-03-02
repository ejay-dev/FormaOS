import type { Metadata, Viewport } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import NextTopLoader from 'nextjs-toploader';
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'FormaOS',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'FormaOS — Compliance Operating System' }],
  },
  twitter: {
    card: 'summary_large_image',
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
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className={inter.className}>
        <NextTopLoader color="#22d3ee" height={2} showSpinner={false} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
