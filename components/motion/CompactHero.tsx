'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { HeroAtmosphere } from './HeroAtmosphere';

interface CompactHeroProps {
  /** Page title */
  title: ReactNode;
  /** Optional description below title */
  description?: ReactNode;
  /** Optional icon above the title */
  icon?: ReactNode;
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
  topColor = 'cyan',
  bottomColor = 'blue',
  className = '',
}: CompactHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <section className={`mk-hero mk-hero--compact relative flex items-center justify-center overflow-hidden ${className}`}>
      <HeroAtmosphere
        topColor={topColor}
        bottomColor={bottomColor}
        particleIntensity="subtle"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center flex flex-col items-center">
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
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] text-white"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            initial={sa ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slow, ease: signatureEase, delay: 0.35 } : { duration: 0 }}
            className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      <noscript>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] text-white">{title}</h1>
          {description && <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">{description}</p>}
        </div>
      </noscript>
    </section>
  );
}

export default CompactHero;
