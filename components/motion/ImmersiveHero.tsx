'use client';

import { useRef, useState, useEffect, useMemo, type ReactNode, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { duration, easing } from '@/config/motion';
import { getHeroTheme, type HeroTheme } from '@/config/hero-themes';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from './HeroAtmosphere';
import { DepthStage } from './DepthStage';
import { DepthLayer } from './DepthLayer';
import { evaluateEnterpriseCopy } from '@/lib/marketing/enterprise-copy';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// =========================================================
// Types
// =========================================================

interface HeroBadge {
  icon: ReactNode;
  text: string;
  colorClass?: HeroBadgeTone;
}

type HeroBadgeTone =
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'teal';

const HERO_BADGE_TONE_CLASSES: Record<
  HeroBadgeTone,
  {
    shell: string;
    text: string;
  }
> = {
  cyan: {
    shell: 'bg-cyan-500/10 border-cyan-500/30',
    text: 'text-cyan-400',
  },
  blue: {
    shell: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
  },
  violet: {
    shell: 'bg-violet-500/10 border-violet-500/30',
    text: 'text-violet-400',
  },
  emerald: {
    shell: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  amber: {
    shell: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
  },
  rose: {
    shell: 'bg-rose-500/10 border-rose-500/30',
    text: 'text-rose-400',
  },
  indigo: {
    shell: 'bg-indigo-500/10 border-indigo-500/30',
    text: 'text-indigo-400',
  },
  teal: {
    shell: 'bg-teal-500/10 border-teal-500/30',
    text: 'text-teal-400',
  },
};

interface HeroCta {
  href: string;
  label: string;
  /** Optional data-testid */
  testId?: string;
}

interface ImmersiveHeroProps {
  /** Theme key from hero-themes.ts, or a HeroTheme object directly */
  theme: string | HeroTheme;
  /** Per-page unique visual content rendered in the midground depth layer */
  visualContent?: ReactNode;
  /** Optional background decoration rendered in the background depth layer */
  backgroundContent?: ReactNode;
  /** Badge configuration */
  badge?: HeroBadge;
  /** Main headline (supports JSX for gradient spans, line breaks) */
  headline: ReactNode;
  /** Subtitle text */
  subheadline: ReactNode;
  /** Optional extra content between subheadline and CTAs (feature pills, etc.) */
  extras?: ReactNode;
  /** Primary CTA button */
  primaryCta: HeroCta;
  /** Secondary CTA button */
  secondaryCta?: HeroCta;
  /** Optional click instrumentation for primary CTA */
  onPrimaryCtaClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Optional click instrumentation for secondary CTA */
  onSecondaryCtaClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Additional className on outer section */
  className?: string;
}

// =========================================================
// Signature transition builder
// =========================================================

const signatureEase: [number, number, number, number] = [...easing.signature] as [
  number,
  number,
  number,
  number,
];

function staggerTransition(delay: number, dur: number = duration.slower) {
  return {
    duration: dur,
    delay,
    ease: signatureEase,
  };
}

// =========================================================
// Component
// =========================================================

/**
 * ImmersiveHero
 * ─────────────
 * Unified hero shell for all marketing pages.
 *
 * Mobile layout:
 *  - Larger type scale (text-[2.5rem] base → sm:text-5xl → lg:text-7xl)
 *  - Full-width buttons with ≥44px tap targets
 *  - Proper spacing rhythm (no tight stacks)
 *  - Visual content positioned below text, not overlapping
 */
export function ImmersiveHero({
  theme,
  visualContent,
  backgroundContent,
  badge,
  headline,
  subheadline,
  extras,
  primaryCta,
  secondaryCta,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className = '',
}: ImmersiveHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  // Defer visual content rendering so text paints first (LCP)
  const [visualReady, setVisualReady] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(() => setVisualReady(true));
      return () => cancelIdleCallback(id);
    }
    const t2 = setTimeout(() => setVisualReady(true), 50);
    return () => clearTimeout(t2);
  }, []);

  // Resolve theme
  const t: HeroTheme = typeof theme === 'string' ? getHeroTheme(theme) : theme;
  const badgeTone = badge?.colorClass ?? 'cyan';
  const badgeToneClasses = HERO_BADGE_TONE_CLASSES[badgeTone];
  const copyIssues = useMemo(
    () =>
      evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        badgeText: badge?.text,
        headline,
        subheadline,
        primaryCtaLabel: primaryCta.label,
        secondaryCtaLabel: secondaryCta?.label,
      }),
    [
      badge?.text,
      headline,
      primaryCta.label,
      secondaryCta?.label,
      subheadline,
    ],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || copyIssues.length === 0) return;
    for (const issue of copyIssues) {
      // Guardrail for marketing copy quality during local iteration.
      console.warn(`[ImmersiveHero copy] ${issue.message}`, issue);
    }
  }, [copyIssues]);

  // ─── Scroll exit transforms ───
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, t.scrollExit.holdUntil, t.scrollExit.fadeStart, t.scrollExit.fadeEnd],
    [1, 1, 0.35, 0],
  );
  const contentScale = useTransform(
    scrollYProgress,
    [0, t.scrollExit.holdUntil, t.scrollExit.fadeStart, t.scrollExit.fadeEnd],
    [1, 1, 0.97, 0.94],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, t.scrollExit.fadeStart, 1],
    [0, 52, 110],
  );

  // Dynamic will-change: remove after hero scrolls past
  const [heroAnimating, setHeroAnimating] = useState(true);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v > t.scrollExit.fadeEnd + 0.05 && heroAnimating) setHeroAnimating(false);
  });

  // ─── 3D entrance animation ───
  const entranceVariants = {
    hidden: {
      opacity: 0,
      scale: t.entrance.initialScale,
      filter: `blur(${t.entrance.initialBlur}px)`,
      z: t.entrance.initialZ,
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      z: 0,
      transition: {
        duration: t.entrance.duration,
        ease: signatureEase,
      },
    },
  };

  // ─── Stagger delays ───
  const delays = {
    badge: 0.15,
    headline: 0.27,
    subheadline: 0.39,
    extras: 0.48,
    ctas: 0.57,
  };

  const resolveCtaHref = (href: string) => {
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith('/')) return href;
    return `${appBase}${href}`;
  };

  const primaryHref = resolveCtaHref(primaryCta.href);
  const secondaryHref = secondaryCta ? resolveCtaHref(secondaryCta.href) : null;
  const secondaryIsExternal = secondaryHref ? /^https?:\/\//i.test(secondaryHref) : false;

  return (
    <section
      ref={containerRef}
      className={`mk-hero relative flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Atmosphere layer (gradients + particles) */}
      <HeroAtmosphere
        topColor={t.gradient.topColor}
        bottomColor={t.gradient.bottomColor}
        particleIntensity={t.particleIntensity}
      />

      {/* 3D Depth Stage */}
      <DepthStage
        perspective={t.tilt.perspective}
        cursorTilt
        tiltIntensity={t.tilt.intensity}
        glowFollow
        glowColor={t.tilt.glowColor}
        className="relative z-10 w-full"
      >
        {/* ─── Background layer (decorative) ─── */}
        {backgroundContent && (
          <DepthLayer
            layer="background"
            parallaxRate={t.parallax.background}
            className="absolute inset-0 pointer-events-none"
          >
            {backgroundContent}
          </DepthLayer>
        )}

        {/* ─── Midground layer (per-page 3D visual content — deferred for LCP) ─── */}
        {visualContent && visualReady && (
          <DepthLayer
            layer="midground"
            parallaxRate={t.parallax.midground}
            className="absolute inset-0 pointer-events-none z-[1]"
          >
            <motion.div
              initial={sa ? entranceVariants.hidden : false}
              animate={sa ? entranceVariants.visible : undefined}
              className="w-full h-full"
            >
              {visualContent}
            </motion.div>
          </DepthLayer>
        )}

        {/* ─── Foreground layer (text content) ─── */}
        <DepthLayer
          layer="foreground"
          parallaxRate={t.parallax.foreground}
          className="relative z-10"
        >
          <motion.div
            style={sa ? { opacity: contentOpacity, scale: contentScale, y: contentY, willChange: heroAnimating ? 'opacity, transform' : 'auto' } : undefined}
            className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-12"
          >
            {/* 3D entrance wrapper for text content */}
            <motion.div
              initial={sa ? entranceVariants.hidden : false}
              animate={sa ? entranceVariants.visible : undefined}
              className="text-center flex flex-col items-center"
            >
              {/* Badge */}
              {badge && (
                <motion.div
                  initial={sa ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={sa ? staggerTransition(delays.badge, duration.slow) : { duration: 0 }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full mb-6 sm:mb-8 backdrop-blur-sm ${badgeToneClasses.shell}`}
                >
                  {badge.icon}
                  <span className={`text-sm font-medium tracking-wide ${badgeToneClasses.text}`}>
                    {badge.text}
                  </span>
                </motion.div>
              )}

              {/* Headline — mobile-first type scale */}
              <motion.h1
                initial={sa ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={sa ? staggerTransition(delays.headline) : { duration: 0 }}
                className="text-[2.35rem] sm:text-5xl lg:text-7xl font-semibold tracking-tight mb-5 sm:mb-6 leading-[1.06] text-white"
              >
                {headline}
              </motion.h1>

              {/* Subheadline — readable mobile size */}
              <motion.p
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={sa ? staggerTransition(delays.subheadline) : { duration: 0 }}
                className="text-base sm:text-lg md:text-xl text-slate-300 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
              >
                {subheadline}
              </motion.p>

              {/* Extras (feature pills, etc.) */}
              {extras && (
                <motion.div
                  initial={sa ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={sa ? staggerTransition(delays.extras) : { duration: 0 }}
                  className="mb-8 sm:mb-10"
                >
                  {extras}
                </motion.div>
              )}

              {/* CTAs — full-width on mobile, side-by-side on sm+ */}
              <motion.div
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={sa ? staggerTransition(delays.ctas) : { duration: 0 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto"
              >
                <motion.a
                  href={primaryHref}
                  data-testid={primaryCta.testId}
                  onClick={onPrimaryCtaClick}
                  whileHover={sa ? { scale: 1.03, boxShadow: `0 0 30px rgba(${t.tilt.glowColor}, 0.3)` } : undefined}
                  whileTap={sa ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-primary group px-8 py-4 min-h-[48px] text-base sm:text-lg justify-center"
                >
                  <span>{primaryCta.label}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                {secondaryCta && secondaryHref && secondaryIsExternal && (
                  <a
                    href={secondaryHref}
                    onClick={onSecondaryCtaClick}
                    className="mk-btn mk-btn-secondary group px-8 py-4 min-h-[48px] text-base sm:text-lg justify-center"
                  >
                    {secondaryCta.label}
                  </a>
                )}

                {secondaryCta && secondaryHref && !secondaryIsExternal && (
                  <Link
                    href={secondaryHref}
                    onClick={onSecondaryCtaClick}
                    className="mk-btn mk-btn-secondary group px-8 py-4 min-h-[48px] text-base sm:text-lg justify-center"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </DepthLayer>
      </DepthStage>

      {/* noscript fallback for SSR/SEO */}
      <noscript>
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-12 text-center flex flex-col items-center">
          <h1 className="text-[2.5rem] sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.08] text-white">
            {headline}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {subheadline}
          </p>
        </div>
      </noscript>
    </section>
  );
}

export default ImmersiveHero;
