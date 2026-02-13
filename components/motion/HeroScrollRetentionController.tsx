'use client';

import {
  motion,
  useScroll,
  useMotionValueEvent,
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

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Show when hero is 55-92 % scrolled out
    setVisible(v > 0.55 && v < 0.92);
  });

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 16,
        pointerEvents: visible ? ('auto' as const) : ('none' as const),
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:bottom-8"
    >
      <motion.a
        href={`${appBase}/auth/signup?plan=pro`}
        whileHover={{
          scale: 1.04,
          boxShadow: '0 0 32px rgba(6, 182, 212, 0.45)',
        }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-3 rounded-full border border-white/10 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-2xl shadow-cyan-500/25 backdrop-blur-md transition-shadow"
      >
        <span className="text-sm md:text-base">Start Free Trial</span>
        <ArrowRight className="h-4 w-4" />
      </motion.a>
    </motion.div>
  );
}

export default HeroScrollRetentionController;
