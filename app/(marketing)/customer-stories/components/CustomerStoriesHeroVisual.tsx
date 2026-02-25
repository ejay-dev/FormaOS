'use client';

import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/* ─── Card data ───────────────────────────────────────────────── */

const CARDS = [
  {
    z: 0,
    rotate: 0,
    yOffset: 0,
    blur: 0,
    accent: 'emerald',
    accentColor: 'rgb(16 185 129)',
    metric: '47% faster',
    lines: 2,
    showLogo: true,
  },
  {
    z: -30,
    rotate: 2,
    yOffset: 16,
    blur: 1,
    accent: 'cyan',
    accentColor: 'rgb(6 182 212)',
    metric: '3× ROI',
    lines: 1,
    showLogo: true,
  },
  {
    z: -55,
    rotate: 4,
    yOffset: 32,
    blur: 2,
    accent: 'violet',
    accentColor: 'rgb(139 92 246)',
    metric: '99.9% uptime',
    lines: 0,
    showLogo: true,
  },
] as const;

/* ─── Component ───────────────────────────────────────────────── */

function CustomerStoriesHeroVisualInner() {
  const prefersReduced = useReducedMotion();
  const cursor = useCursorPosition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Cursor-driven tilt (±3°) */
  const rotateX = useTransform(cursor.mouseY, [0, 1], [3, -3]);
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-3, 3]);

  /* Cards separate slightly with cursor Y movement */
  const spreadFactor = useTransform(cursor.mouseY, [0, 1], [0.8, 1.2]);

  /* ── Reduced-motion: static layout ──────────────────────────── */
  if (prefersReduced) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[320px] h-[260px] relative ml-auto">
        {CARDS.slice()
          .reverse()
          .map((card, i) => (
            <div
              key={i}
              className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] w-[240px] h-[160px]"
              style={{
                transform: `translateZ(${card.z}px) rotate(${card.rotate}deg)`,
                top: `${50 + card.yOffset}px`,
                left: '40px',
                filter: card.blur ? `blur(${card.blur}px)` : undefined,
              }}
            >
              <CardContent card={card} checked />
            </div>
          ))}
      </div>
    );
  }

  /* ── Animated layout ────────────────────────────────────────── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[320px] h-[260px] relative ml-auto">
      <motion.div
        className="relative w-full h-full"
        style={{
          perspective: '800px',
          transformStyle: 'preserve-3d',
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* Floating sine animation wrapper */}
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {CARDS.slice()
            .reverse()
            .map((card, reverseIdx) => {
              const idx = CARDS.length - 1 - reverseIdx;
              return (
                <motion.div
                  key={idx}
                  className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] w-[240px] h-[160px] shadow-lg"
                  style={{
                    transformStyle: 'preserve-3d',
                    filter: card.blur ? `blur(${card.blur}px)` : undefined,
                    left: '40px',
                  }}
                  initial={{
                    x: 120,
                    opacity: 0,
                    rotateZ: card.rotate,
                    translateZ: card.z,
                    y: 50 + card.yOffset,
                  }}
                  animate={
                    mounted
                      ? {
                          x: 0,
                          opacity: 1,
                          rotateZ: card.rotate,
                          translateZ: card.z,
                          y: 50 + card.yOffset,
                        }
                      : undefined
                  }
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <CardContent card={card} checked={mounted} />
                </motion.div>
              );
            })}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Card inner content ──────────────────────────────────────── */

interface CardProps {
  card: (typeof CARDS)[number];
  checked: boolean;
}

function CardContent({ card, checked }: CardProps) {
  const pillBg =
    card.accent === 'emerald'
      ? 'bg-emerald-500/20 text-emerald-300'
      : card.accent === 'cyan'
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'bg-violet-500/20 text-violet-300';

  return (
    <div className="p-4 h-full flex flex-col justify-between">
      {/* Top: Logo placeholder */}
      {card.showLogo && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
          {card.lines > 0 && (
            <div className="flex flex-col gap-1.5 mt-1 flex-1">
              <div className="h-2 rounded-full bg-white/[0.08] w-full" />
              {card.lines > 1 && (
                <div className="h-2 rounded-full bg-white/[0.08] w-3/4" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom-right: metric badge */}
      <div className="flex justify-end">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pillBg}`}
        >
          {card.metric}
        </span>
      </div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */

export const CustomerStoriesHeroVisual = memo(CustomerStoriesHeroVisualInner);
export default CustomerStoriesHeroVisual;
