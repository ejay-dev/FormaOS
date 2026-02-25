'use client';

/**
 * ProductHeroShowcase — /product page hero + live interactive demo
 *
 * Exports:
 *   ProductHero     — Immersive 3D hero with scroll-driven UI transformation
 *   ProductShowcase — Live interactive app demo below the hero
 */

import { useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { ProductHeroVisual } from '@/app/(marketing)/product/components/ProductHeroVisual';
import { ProductLiveDemo } from './ProductLiveDemo';

const PRODUCT_CHIPS = [
  { label: 'Structured Controls', color: 'bg-teal-400' },
  { label: 'Owned Actions', color: 'bg-emerald-400' },
  { label: 'Live Evidence', color: 'bg-amber-400' },
];

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION — immersive 3D hero with scroll-driven UI transformation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHero() {
  return (
    <ImmersiveHero
      theme="product"
      visualContent={<ProductHeroVisual />}
      badge={{
        icon: <Sparkles className="w-4 h-4 text-violet-400" />,
        text: 'Compliance Operating System',
        colorClass: 'violet',
      }}
      headline={
        <>
          The Compliance OS
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
            for Real Organizations
          </span>
        </>
      }
      subheadline="Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time."
      extras={
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto text-center">
            Used by compliance teams. Aligned to ISO & SOC frameworks. Built for audit defensibility.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            {PRODUCT_CHIPS.map((chip) => (
              <span key={chip.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      }
      primaryCta={{ href: '/auth/signup', label: 'Start Free Trial' }}
      secondaryCta={{ href: '/contact', label: 'Request Demo' }}
    />
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
