'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatedHeroBg } from './AnimatedHeroBg';

export interface JurisdictionBadge {
  label: string;
  icon?: ReactNode;
}

export interface IndustryHeroProps {
  /**
   * Accepted but not rendered. The hero carries the headline, the
   * subheadline, two calls to action and a single proof line — a kicker
   * above the headline is a fourth competing label in the same block.
   */
  eyebrow?: string;
  headline: ReactNode;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /** Fallback proof line, used when a page passes no `statsBar`. */
  trustSignals: string[];
  dashboardVisual: ReactNode;
  /** Gradient accent for animated background. Enables AnimatedHeroBg when set. */
  accent?: string;
  /** The hero's single proof line. Takes precedence over `trustSignals`. */
  statsBar?: ReactNode;
  /**
   * Accepted but not rendered. Jurisdiction names already appear in the
   * proof line and in the framework section below the fold.
   */
  jurisdictionBadges?: JurisdictionBadge[];
  /**
   * Optional supporting context line. Per audit row #8 (2026-05-13),
   * do NOT use this slot for "trusted by [customers]" framing until
   * real signed customers consent to be named. Acceptable patterns:
   * framework alignment ("Aligned with NDIS Practice Standards"), or
   * platform capability ("All 8 standards modules covered").
   */
  socialProof?: string;
}

export function IndustryHero({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  trustSignals,
  dashboardVisual,
  accent,
  statsBar,
  socialProof,
}: IndustryHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    // svh, not vh: on iOS the collapsing URL bar makes 100vh taller than the
    // visible viewport, which pushes the hero into an overflow scroll.
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background atmosphere */}
      {accent ? (
        <AnimatedHeroBg accent={accent} />
      ) : (
        <div className="absolute inset-0 z-0 bg-marketing-bg" />
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy column */}
          <div className="max-w-2xl">
            {/* Headline */}
            <motion.h1
              {...fadeUp(0)}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.08] tracking-tight text-white font-[var(--font-display)]"
            >
              {headline}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.1)}
              className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-400 max-w-xl"
            >
              {subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.2)}
              className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
            >
              <Link
                href={primaryCta.href}
                className="group inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-foreground text-background px-7 py-3.5 text-sm font-semibold shadow-lg transition-all hover:opacity-90"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={secondaryCta.href}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                {secondaryCta.label}
              </Link>
            </motion.div>

            {/* One proof line */}
            {statsBar ?? (
              <motion.div
                {...fadeUp(0.3)}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                {trustSignals.slice(0, 3).map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-400"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-slate-500" />
                    {signal}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Social proof */}
            {socialProof && (
              <motion.p
                {...fadeUp(0.4)}
                className="mt-5 text-[13px] font-medium text-slate-500"
              >
                {socialProof}
              </motion.p>
            )}
          </div>

          {/* Dashboard visual column */}
          <motion.div {...fadeUp(0.2)} className="relative lg:pl-4">
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1">
              <div className="rounded-xl bg-marketing-bg overflow-hidden">
                {dashboardVisual}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
