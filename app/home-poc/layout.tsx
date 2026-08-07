import type { Metadata } from 'next';
import { Archivo, Spline_Sans_Mono } from 'next/font/google';
import './poc.css';

/**
 * Brutalist-editorial type system.
 * — Archivo (variable, incl. width axis) carries the whole grotesque voice:
 *   pushed to Black + Expanded it gives monumental poster headlines without
 *   the Inter/Sora/Fraunces "AI default" tell.
 * — Spline Sans Mono is the technical metadata voice (mastheads, ledgers,
 *   coordinates, callouts).
 *
 * PRODUCTION UPGRADE: swap --bru-sans for a licensed grotesque (GT America /
 * Söhne / ABC Diatype) and the display face for Druk Wide — one var change in
 * poc.css. Stand-ins here are the closest self-hostable equivalents.
 */
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--bru-sans',
  weight: 'variable',
  axes: ['wdth'],
});

const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--bru-mono',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'FormaOS — Homepage POC (Brutalist-Editorial)',
  robots: { index: false, follow: false },
};

export default function HomePocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${archivo.variable} ${mono.variable} bru-root`}>
      {children}
    </div>
  );
}
