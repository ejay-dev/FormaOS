'use client';

import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/* ─── Pill data ───────────────────────────────────────────────── */

const PILLS = [
  { text: 'How does it work?', x: -130, y: -120, z: -10, delay: 1.1, floatDuration: 4.8 },
  { text: 'Is it secure?', x: 120, y: -90, z: -30, delay: 1.25, floatDuration: 5.2 },
  { text: 'Pricing plans?', x: -110, y: 100, z: -20, delay: 1.4, floatDuration: 4.4 },
  { text: 'API access?', x: 140, y: 80, z: -40, delay: 1.55, floatDuration: 5.6 },
  { text: 'SOC 2 ready?', x: -20, y: 150, z: -50, delay: 1.7, floatDuration: 5.0 },
] as const;

/* ─── Question-mark SVG path ──────────────────────────────────── */

const Q_PATH =
  'M50 10 C25 10 10 30 10 50 C10 70 25 80 40 85 L40 100 L60 100 L60 82 C75 77 90 65 90 50 C90 25 70 10 50 10 Z M45 115 L55 115 L55 130 L45 130 Z';

/* ─── Component ───────────────────────────────────────────────── */

function FAQHeroVisualInner() {
  const prefersReduced = useReducedMotion();
  const cursor = useCursorPosition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Cursor-driven tilt (±3°) */
  const rotateX = useTransform(cursor.mouseY, [0, 1], [3, -3]);
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-3, 3]);

  /* Per-pill parallax multipliers based on z depth */
  const parallaxX = useTransform(cursor.mouseX, [0, 1], [-6, 6]);
  const parallaxY = useTransform(cursor.mouseY, [0, 1], [-6, 6]);

  /* ── Reduced motion: static ─────────────────────────────────── */
  if (prefersReduced) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[400px] h-[380px] relative">
        {/* Question mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="100"
            height="140"
            viewBox="0 0 100 140"
            fill="none"
            className="drop-shadow-[0_0_24px_rgba(6,182,212,0.5)]"
          >
            <path
              d={Q_PATH}
              stroke="rgb(6 182 212)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Pills */}
        {PILLS.map((pill, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-3 py-1 whitespace-nowrap"
            style={{
              left: `calc(50% + ${pill.x}px)`,
              top: `calc(50% + ${pill.y}px)`,
              transform: `translateX(-50%) translateZ(${pill.z}px)`,
            }}
          >
            <span className="text-[11px] text-white/60">{pill.text}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Animated layout ────────────────────────────────────────── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[400px] h-[380px] relative">
      <motion.div
        className="relative w-full h-full"
        style={{
          perspective: '900px',
          transformStyle: 'preserve-3d',
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* ── Central question mark ──────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Pulsing glow ring */}
          <motion.div
            className="absolute w-[160px] h-[160px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* SVG question mark with draw-on animation */}
          <svg
            width="100"
            height="140"
            viewBox="0 0 100 140"
            fill="none"
            className="drop-shadow-[0_0_24px_rgba(6,182,212,0.5)]"
          >
            <motion.path
              d={Q_PATH}
              stroke="rgb(6 182 212)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={mounted ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </div>

        {/* ── Floating pills ─────────────────────────────────── */}
        {PILLS.map((pill, i) => {
          const depthScale = Math.abs(pill.z) / 50; // 0-1 for parallax intensity
          return (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-3 py-1 whitespace-nowrap shadow-lg"
              style={{
                left: `calc(50% + ${pill.x}px)`,
                top: `calc(50% + ${pill.y}px)`,
                translateX: '-50%',
                transformStyle: 'preserve-3d',
                translateZ: pill.z,
                x: cursor.isActive
                  ? useTransform(parallaxX, (v) => v * depthScale)
                  : 0,
                y: cursor.isActive
                  ? useTransform(parallaxY, (v) => v * depthScale)
                  : 0,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={mounted ? { opacity: 1, scale: 1 } : undefined}
              transition={{
                duration: 0.5,
                delay: pill.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Independent sine-wave float */}
              <motion.span
                className="text-[11px] text-white/60 block"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: pill.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {pill.text}
              </motion.span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */

export const FAQHeroVisual = memo(FAQHeroVisualInner);
export default FAQHeroVisual;
