'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * DocsHeroVisual — "Knowledge Architecture"
 * ──────────────────────────────────────────
 * Open book/document motif with 3 page layers fanning from a center spine.
 * 4 floating chapter marker pills orbit at different Z depths.
 * Cursor tilts the book and separates pages; pills parallax.
 * Desktop-only, pointer-events-none.
 */

const CHAPTER_MARKERS = [
  { label: 'Getting Started', angle: -35, z: -15, delay: 0.9 },
  { label: 'API Reference', angle: 30, z: -25, delay: 1.0 },
  { label: 'Guides', angle: -60, z: -35, delay: 1.1 },
  { label: 'FAQ', angle: 55, z: -45, delay: 1.2 },
] as const;

const GLASS =
  'rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]';

function DocsHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Cursor-driven tilt (+-3deg)
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-3, 3]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [3, -3]);

  // Cursor X controls page fan spread (0-1 -> -2 to +2 extra degrees)
  const fanExtra = useTransform(cursor.mouseX, [0, 1], [-2, 2]);

  // Chapter pill parallax offsets
  const pillParX = useTransform(cursor.mouseX, [0, 1], [6, -6]);
  const pillParY = useTransform(cursor.mouseY, [0, 1], [6, -6]);

  /* ── Static layout for reduced-motion ── */
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[400px] h-[350px]">
        <div className="relative" style={{ width: 400, height: 350 }}>
          {/* Spine */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/[0.15]"
            style={{ width: 1, height: 280 }}
          />
          {/* Center page */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${GLASS} p-4 flex flex-col gap-2.5`}
            style={{ width: 200, height: 280 }}
          >
            {[75, 55, 85, 40, 65].map((w, i) => (
              <div
                key={i}
                className="h-[6px] rounded-full bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
            <div className="mt-2 h-[28px] rounded-lg bg-cyan-500/10" />
            <div className="h-[22px] rounded-lg bg-cyan-500/10" />
          </div>
          {/* Left page */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${GLASS} p-4 flex flex-col gap-3 opacity-60`}
            style={{
              width: 190,
              height: 270,
              transform: 'translate(-50%, -50%) rotate(-6deg)',
              transformOrigin: 'right center',
            }}
          >
            {[65, 50, 70].map((w, i) => (
              <div
                key={i}
                className="h-[5px] rounded-full bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {/* Right page */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${GLASS} p-4 flex flex-col gap-3 opacity-60`}
            style={{
              width: 190,
              height: 270,
              transform: 'translate(-50%, -50%) rotate(6deg)',
              transformOrigin: 'left center',
            }}
          >
            {[60, 75, 45].map((w, i) => (
              <div
                key={i}
                className="h-[5px] rounded-full bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {/* Chapter markers */}
          {CHAPTER_MARKERS.map((ch) => {
            const rad = (ch.angle * Math.PI) / 180;
            const x = Math.cos(rad) * 170;
            const y = Math.sin(rad) * 140;
            return (
              <div
                key={ch.label}
                className={`absolute ${GLASS} flex items-center gap-1.5 px-2`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: 80,
                  height: 24,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[8px] text-white/60 font-medium whitespace-nowrap">
                  {ch.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Animated layout ── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[400px] h-[350px]">
      <motion.div
        className="relative"
        style={{
          perspective: 900,
          transformStyle: 'preserve-3d',
          width: 400,
          height: 350,
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* Spine */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/[0.15]"
          style={{ width: 1, height: 280, transform: 'translateZ(5px)' }}
        />

        {/* Left page (z=-25) */}
        <motion.div
          className={`absolute left-1/2 top-1/2 ${GLASS} p-4 flex flex-col gap-3 opacity-60`}
          style={{
            width: 190,
            height: 270,
            translateX: '-50%',
            translateY: '-50%',
            translateZ: -25,
            transformOrigin: 'right center',
            rotateY: cursor.isActive
              ? useTransform(fanExtra, (v) => -6 + v * -0.5)
              : -6,
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {[65, 50, 70].map((w, i) => (
            <div
              key={i}
              className="h-[5px] rounded-full bg-white/10"
              style={{ width: `${w}%` }}
            />
          ))}
        </motion.div>

        {/* Right page (z=-25) */}
        <motion.div
          className={`absolute left-1/2 top-1/2 ${GLASS} p-4 flex flex-col gap-3 opacity-60`}
          style={{
            width: 190,
            height: 270,
            translateX: '-50%',
            translateY: '-50%',
            translateZ: -25,
            transformOrigin: 'left center',
            rotateY: cursor.isActive
              ? useTransform(fanExtra, (v) => 6 + v * 0.5)
              : 6,
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {[60, 75, 45].map((w, i) => (
            <div
              key={i}
              className="h-[5px] rounded-full bg-white/10"
              style={{ width: `${w}%` }}
            />
          ))}
        </motion.div>

        {/* Center page (z=0) — on top */}
        <motion.div
          className={`absolute left-1/2 top-1/2 ${GLASS} p-4 flex flex-col gap-2.5`}
          style={{
            width: 200,
            height: 280,
            translateX: '-50%',
            translateY: '-50%',
            translateZ: 0,
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 5 text lines at different widths */}
          {[75, 55, 85, 40, 65].map((w, i) => (
            <div
              key={i}
              className="h-[6px] rounded-full bg-white/10"
              style={{ width: `${w}%` }}
            />
          ))}
          {/* 2 code block rectangles */}
          <div className="mt-2 h-[28px] rounded-lg bg-cyan-500/10 border border-cyan-500/5" />
          <div className="h-[22px] rounded-lg bg-cyan-500/10 border border-cyan-500/5" />
        </motion.div>

        {/* Chapter marker pills */}
        {CHAPTER_MARKERS.map((ch) => {
          const rad = (ch.angle * Math.PI) / 180;
          const x = Math.cos(rad) * 170;
          const y = Math.sin(rad) * 140;
          return (
            <motion.div
              key={ch.label}
              className={`absolute ${GLASS} flex items-center gap-1.5 px-2`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: 80,
                height: 24,
                translateZ: ch.z,
                x: cursor.isActive ? pillParX : 0,
                y: cursor.isActive ? pillParY : 0,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: ch.delay,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
              <span className="text-[8px] text-white/60 font-medium whitespace-nowrap">
                {ch.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export const DocsHeroVisual = memo(DocsHeroVisualInner);
export default DocsHeroVisual;
