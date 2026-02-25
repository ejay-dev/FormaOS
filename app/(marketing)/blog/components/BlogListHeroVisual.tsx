'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * BlogListHeroVisual — "Editorial Stack"
 * ───────────────────────────────────────
 * 4 article cards stacked in 3D depth with progressive blur and rotation.
 * Cursor fans out the stack horizontally; each card gets independent rotateY.
 * Entrance slides in from right with stagger. Gentle sine float on stack.
 * Desktop-only, pointer-events-none.
 */

const CARDS = [
  { accent: 'bg-violet-500/60', accentName: 'violet', z: 0, yOff: 0, rot: 0, blur: 0, scale: 1 },
  { accent: 'bg-rose-500/60', accentName: 'rose', z: -20, yOff: 18, rot: 1.5, blur: 1, scale: 0.97 },
  { accent: 'bg-blue-500/60', accentName: 'blue', z: -40, yOff: 36, rot: 3, blur: 1.5, scale: 0.94 },
  { accent: 'bg-cyan-500/60', accentName: 'cyan', z: -60, yOff: 54, rot: 4.5, blur: 2, scale: 0.91 },
] as const;

const CARD_W = 260;
const CARD_H = 180;

function BlogListHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Cursor-driven fan-out: cards shift horizontally based on cursor X
  const fanSpread = useTransform(cursor.mouseX, [0, 1], [-12, 12]);
  // Cursor-driven rotateY per card (intensity increases for back cards)
  const cursorRotBase = useTransform(cursor.mouseX, [0, 1], [-6, 6]);

  // Static layout for reduced motion
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[320px] h-[280px]">
        <div className="relative" style={{ width: CARD_W, height: CARD_H + 60, marginLeft: 20 }}>
          {[...CARDS].reverse().map((card, ri) => {
            const i = CARDS.length - 1 - ri;
            return (
              <div
                key={i}
                className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] overflow-hidden"
                style={{
                  width: CARD_W * card.scale,
                  height: CARD_H * card.scale,
                  top: card.yOff,
                  left: 0,
                  transform: `rotate(${card.rot}deg)`,
                  filter: card.blur > 0 ? `blur(${card.blur}px)` : undefined,
                }}
              >
                <div className={`h-1.5 w-full ${card.accent}`} />
                <div className="p-4 space-y-2.5">
                  <div className="w-3/4 h-3 bg-white/20 rounded" />
                  <div className="space-y-1.5">
                    <div className="w-full h-2 bg-white/10 rounded" />
                    <div className="w-full h-2 bg-white/10 rounded" />
                    <div className="w-5/6 h-2 bg-white/10 rounded" />
                  </div>
                  {i === 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-12 h-2 bg-white/10 rounded" />
                      <div className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                        <div className="w-8 h-1.5 bg-white/15 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[320px] h-[280px]">
      {/* Gentle sine float on the whole stack */}
      <motion.div
        className="relative"
        style={{
          width: CARD_W + 40,
          height: CARD_H + 80,
          perspective: 800,
          transformStyle: 'preserve-3d',
          marginLeft: 20,
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Render back cards first (reverse order for z-index) */}
        {[...CARDS].reverse().map((card, ri) => {
          const i = CARDS.length - 1 - ri;
          // Per-card cursor rotateY: intensity increases for back cards
          const cardRotateY = useTransform(cursorRotBase, (v) => v * (1 + i * 0.4));
          // Per-card fan offset
          const cardFanX = useTransform(fanSpread, (v) => v * i);

          return (
            <motion.div
              key={i}
              className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] overflow-hidden"
              style={{
                width: CARD_W * card.scale,
                height: CARD_H * card.scale,
                top: card.yOff,
                left: 20,
                translateZ: card.z,
                translateX: cursor.isActive ? cardFanX : 0,
                rotate: card.rot,
                rotateY: cursor.isActive ? cardRotateY : 0,
                transformStyle: 'preserve-3d',
                filter: card.blur > 0 ? `blur(${card.blur}px)` : undefined,
              }}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.3 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Accent bar */}
              <div className={`h-1.5 w-full ${card.accent}`} />

              {/* Card content */}
              <div className="p-4 space-y-2.5">
                {/* Title line */}
                <div className="w-3/4 h-3 bg-white/20 rounded" />

                {/* Text lines */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-white/10 rounded" />
                  <div className="w-full h-2 bg-white/10 rounded" />
                  <div className="w-5/6 h-2 bg-white/10 rounded" />
                </div>

                {/* Front card gets extra detail: date + category badge */}
                {i === 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-12 h-2 bg-white/10 rounded" />
                    <div className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                      <div className="w-8 h-1.5 bg-white/15 rounded" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export const BlogListHeroVisual = memo(BlogListHeroVisualInner);
export default BlogListHeroVisual;
