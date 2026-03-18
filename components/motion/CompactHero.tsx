'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { HeroAtmosphere } from './HeroAtmosphere';
import { evaluateEnterpriseCopy } from '@/lib/marketing/enterprise-copy';

interface CompactHeroProps {
  /** Page title */
  title: ReactNode;
  /** Optional description below title */
  description?: ReactNode;
  /** Optional icon above the title */
  icon?: ReactNode;
  /** Optional floating 3D visual content (e.g. CompactHeroIcon) */
  visualContent?: ReactNode;
  /** HeroAtmosphere top glow color */
  topColor?: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
  /** HeroAtmosphere bottom glow color */
  bottomColor?: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
  /** Additional className on section */
  className?: string;
}

const signatureEase: [number, number, number, number] = [...easing.signature] as [
  number,
  number,
  number,
  number,
];

/**
 * CompactHero
 * ───────────
 * Lightweight hero for informational pages (legal, trust sub-pages, etc.).
 * Subtle atmosphere + static text. No scroll transforms, no 3D depth, no tilt.
 */
export function CompactHero({
  title,
  description,
  icon,
  visualContent,
  topColor = 'cyan',
  bottomColor = 'blue',
  className = '',
}: CompactHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const copyIssues = useMemo(
    () =>
      evaluateEnterpriseCopy({
        surface: 'compact_hero',
        title,
        description,
      }),
    [description, title],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || copyIssues.length === 0) return;
    for (const issue of copyIssues) {
      // Guardrail for trust/legal informational pages.
      console.warn(`[CompactHero copy] ${issue.message}`, issue);
    }
  }, [copyIssues]);

  return (
    <section className={`mk-hero mk-hero--compact relative flex items-center justify-center overflow-hidden ${className}`}>
      <HeroAtmosphere
        topColor={topColor}
        bottomColor={bottomColor}
        particleIntensity="subtle"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center lg:flex-row lg:text-left lg:gap-8">
        <div className="flex flex-col items-center lg:items-start flex-1">
          {icon && (
            <motion.div
              initial={sa ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.normal, ease: signatureEase, delay: 0.1 } : { duration: 0 }}
              className="mb-4"
            >
              {icon}
            </motion.div>
          )}

          <motion.h1
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slow, ease: signatureEase, delay: 0.2 } : { duration: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08] text-white"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              initial={sa ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slow, ease: signatureEase, delay: 0.35 } : { duration: 0 }}
              className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>

        {visualContent && (
          <div className="hidden lg:flex items-center justify-center shrink-0">
            {visualContent}
          </div>
        )}
      </div>

      <noscript>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08] text-white">{title}</h1>
          {description && <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">{description}</p>}
        </div>
      </noscript>
    </section>
  );
}

export default CompactHero;
