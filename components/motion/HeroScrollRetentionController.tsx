'use client';

import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { useState, type RefObject } from 'react';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/**
 * HeroScrollRetentionController
 * ─────────────────────────────
 * Floating sticky CTA that appears when the hero CTAs scroll out of view.
 * Fades in at ~55 % hero scroll, fades out before hero fully exits.
 * Glass morphism + gradient glow — premium, non-aggressive.
 */
export function HeroScrollRetentionController({
  heroRef,
}: {
  heroRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Keep primary hero CTA present longer. Sticky helper appears late.
    setVisible(v > 0.72 && v < 0.97);
  });

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 18,
        pointerEvents: visible ? ('auto' as const) : ('none' as const),
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0.01 }
          : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      }
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:bottom-8"
    >
      <motion.a
        href={`${appBase}/auth/signup?plan=pro`}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                scale: 1.02,
                boxShadow: '0 0 32px rgba(6, 182, 212, 0.45)',
              }
        }
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        className="mk-btn mk-btn-primary flex items-center gap-3 px-5 py-3 md:px-6 md:py-3.5 text-sm md:text-base shadow-2xl shadow-cyan-500/25 backdrop-blur-md"
      >
        <span className="text-sm md:text-base">Start Free Trial</span>
        <ArrowRight className="h-4 w-4" />
      </motion.a>
    </motion.div>
  );
}

export default HeroScrollRetentionController;
