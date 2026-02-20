'use client';

/**
 * ProductHeroShowcase — /product page hero + live interactive demo
 *
 * Exports:
 *   ProductHero     — Traditional marketing hero (headline, gradient, CTAs)
 *   ProductShowcase — Live interactive app demo below the hero
 */

import { useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { ProductLiveDemo } from './ProductLiveDemo';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION — traditional marketing hero at the top
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.9, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.97]);

  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 pb-20"
      style={{ opacity: heroOpacity, scale: heroScale }}
    >
      <HeroAtmosphere topColor="teal" bottomColor="amber" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <CursorTilt intensity={3} glowFollow glowColor="45,212,191">
        <motion.div
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500/[0.08] border border-teal-500/25 mb-8"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">Compliance Operating System</span>
        </motion.div>

        <motion.h1
          initial={sa ? { opacity: 0, y: 28 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.25 } : { duration: 0 }}
          className="text-4xl sm:text-5xl lg:text-7xl xl:text-[5.2rem] font-bold mb-8 leading-[1.05] tracking-tight text-white"
        >
          The Compliance OS
          <br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            for Real Organizations
          </span>
        </motion.h1>

        <motion.p
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.4 } : { duration: 0 }}
          className="text-lg sm:text-xl lg:text-2xl text-slate-400 mb-6 max-w-3xl mx-auto leading-relaxed"
        >
          Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
        </motion.p>

        <motion.p
          initial={sa ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
          className="text-sm sm:text-base text-slate-500 mb-12 max-w-xl mx-auto"
        >
          Used by compliance teams. Aligned to ISO &amp; SOC frameworks. Built for audit defensibility.
        </motion.p>

        <motion.div
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.55 } : { duration: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <motion.a
            href={`${appBase}/auth/signup`}
            whileHover={sa ? { scale: 1.03, boxShadow: '0 0 40px rgba(20,184,166,0.3)' } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group px-10 py-4 text-base lg:text-lg"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="/contact"
            whileHover={sa ? { scale: 1.03 } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-secondary group px-10 py-4 text-base lg:text-lg"
          >
            <span>Request Demo</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={sa ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={sa ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
          className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500"
        >
          {[
            { label: 'Structured Controls', color: 'bg-teal-400' },
            { label: 'Owned Actions', color: 'bg-emerald-400' },
            { label: 'Live Evidence', color: 'bg-amber-400' },
          ].map((chip) => (
            <span key={chip.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
              {chip.label}
            </span>
          ))}
        </motion.div>
        </CursorTilt>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHOWCASE — live interactive app demo below the hero
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);

  return (
    <motion.section
      ref={containerRef}
      className="relative py-16 sm:py-20 overflow-hidden"
      style={{ opacity: sectionOpacity }}
      aria-label="Interactive product demo"
    >
      {/* Section border */}
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.15) 50%, transparent 100%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            height: 'clamp(420px, 60vh, 680px)',
            boxShadow: '0 0 80px rgba(45,212,191,0.08), 0 0 160px rgba(45,212,191,0.04), 0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          <ProductLiveDemo />
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BACKWARD-COMPAT ALIASES (used by ProductPageContent dynamic imports)
   ═══════════════════════════════════════════════════════════════════════ */

export { ProductHero as ProductHeroAnimation };
export { ProductShowcase as ProductHeroCopy };

export default ProductHero;
