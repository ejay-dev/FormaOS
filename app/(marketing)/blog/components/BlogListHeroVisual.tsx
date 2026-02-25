'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * BlogListHeroVisual
 * ──────────────────
 * Unique visual for the Blog listing page hero:
 * - 4 stylized article preview cards stacked at slight offset angles
 * - Glass morphism with progressive blur on deeper cards
 * - Colored accent bars, fake title/text lines
 * - Staggered slide-up entrance + floating group animation
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */

const CARDS = [
  { accent: 'bg-violet-500/60', blur: 'blur(2px)', zIndex: 10, offset: { x: -15, y: -22 } },
  { accent: 'bg-rose-500/60', blur: 'blur(1.5px)', zIndex: 20, offset: { x: -5, y: -8 } },
  { accent: 'bg-blue-500/60', blur: 'blur(0.5px)', zIndex: 30, offset: { x: 5, y: 8 } },
  { accent: 'bg-cyan-500/60', blur: 'none', zIndex: 40, offset: { x: 15, y: 22 } },
];

function BlogListHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Floating editorial card stack — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Floating group wrapper */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={sa ? { y: [0, -8, 0] } : undefined}
          transition={sa ? {
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          } : undefined}
        >
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden"
              style={{
                width: 240,
                height: 160,
                left: card.offset.x,
                top: card.offset.y,
                zIndex: card.zIndex,
                filter: card.blur !== 'none' ? card.blur : undefined,
              }}
              initial={sa ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? {
                duration: duration.slower,
                delay: 0.4 + i * 0.15,
                ease: signatureEase,
              } : { duration: 0 }}
            >
              {/* Accent bar at top */}
              <div className={`h-1.5 w-full ${card.accent}`} />

              {/* Card content */}
              <div className="p-4 space-y-2.5">
                {/* Fake title line */}
                <div className="w-3/4 h-3 bg-white/20 rounded" />

                {/* Fake text lines */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-white/10 rounded" />
                  <div className="w-full h-2 bg-white/10 rounded" />
                  <div className="w-5/6 h-2 bg-white/10 rounded" />
                </div>
              </div>

              {/* Top card violet glow */}
              {i === CARDS.length - 1 && (
                <div className="absolute inset-0 rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] pointer-events-none" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export const BlogListHeroVisual = memo(BlogListHeroVisualInner);
export default BlogListHeroVisual;
