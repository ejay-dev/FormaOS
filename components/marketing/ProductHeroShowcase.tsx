'use client';

/**
 * ProductHeroShowcase — /product page hero + live interactive demo
 *
 * Exports:
 *   ProductHero     — Cinematic scroll-driven hero with 3D compliance core
 *   ProductShowcase — Live interactive app demo below the hero
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ProductScrollHero } from '@/app/(marketing)/product/components/ProductScrollHero';
import { ProductLiveDemo } from './ProductLiveDemo';

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION — cinematic scroll-driven 3D compliance core
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHero() {
  return <ProductScrollHero />;
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
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0.7, 1, 1, 0.7]);

  return (
    <motion.section
      ref={containerRef}
      className="relative pt-8 sm:pt-12 pb-12 sm:pb-16 overflow-hidden"
      style={{ opacity: sectionOpacity }}
      aria-label="Interactive product demo"
    >
      {/* Section heading */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 mb-6 sm:mb-8 text-center">
        <h2 className="text-lg sm:text-xl font-semibold text-white/70">
          Experience the full platform
        </h2>
        <p className="text-sm text-white/30 mt-1">Interactive demo — click around to explore</p>
      </div>

      {/* Subtle top divider */}
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.15) 50%, transparent 100%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            height: 'clamp(400px, 55vh, 640px)',
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
