import type { Metadata } from 'next';
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './poc.css';

// Editorial display serif — optical sizing on, expressive but enterprise.
// Deliberately NOT Sora; this is the "design annual" voice.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--poc-serif',
  axes: ['opsz', 'SOFT', 'WONK'],
  weight: 'variable',
  style: ['normal', 'italic'],
});

// Body grotesque — humanist, quiet, not Inter.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--poc-sans',
  weight: ['400', '500', '600', '700'],
});

// Technical mono for eyebrows, indices and numerals.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--poc-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'FormaOS — Homepage POC (Editorial Monochrome)',
  robots: { index: false, follow: false },
};

export default function HomePocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable} poc-root`}
    >
      {children}
    </div>
  );
}
