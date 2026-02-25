'use client';

import { memo, type ReactNode } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * OurStoryHeroVisual — "Origin Path"
 * ────────────────────────────────────
 * 3D path stretching into perspective depth with converging SVG lines,
 * milestone markers (2022-2026), and floating glass icon cards.
 * Cursor tilts the path and adds parallax to milestones.
 * Desktop-only, pointer-events-none.
 */

const MILESTONES = [
  { year: '2022', label: 'Founded', y: 320, z: -10, delay: 0.9 },
  { year: '2023', label: 'First Client', y: 255, z: -20, delay: 1.0 },
  { year: '2024', label: 'SOC 2 Cert', y: 190, z: -30, delay: 1.1 },
  { year: '2025', label: 'Series A', y: 125, z: -40, delay: 1.2 },
  { year: '2026', label: 'Global', y: 60, z: -50, delay: 1.3 },
] as const;

const FLOATING_CARDS = [
  {
    icon: 'shield',
    x: -110,
    y: 100,
    z: -20,
    delay: 1.4,
  },
  {
    icon: 'chart',
    x: 120,
    y: 200,
    z: -35,
    delay: 1.5,
  },
  {
    icon: 'globe',
    x: -100,
    y: 280,
    z: -15,
    delay: 1.6,
  },
] as const;

const GLASS =
  'rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]';

/* Converging path coordinates — 3 lines from wide bottom to narrow top */
const PATHS = [
  'M 100 380 Q 140 200 175 30',   // left line
  'M 175 380 Q 175 200 175 30',   // center line
  'M 250 380 Q 210 200 175 30',   // right line
];

function IconShield() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className="text-emerald-400/60">
      <path
        d="M10 1L2 4.5V10.5C2 15.5 5.5 20 10 21C14.5 20 18 15.5 18 10.5V4.5L10 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-cyan-400/60">
      <rect x="2" y="10" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="6" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="2" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400/60">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="10" cy="10" rx="4" ry="8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => ReactNode> = {
  shield: IconShield,
  chart: IconChart,
  globe: IconGlobe,
};

function OurStoryHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Cursor tilt (+-4deg)
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-4, 4]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [4, -4]);

  // Milestone parallax
  const mileParX = useTransform(cursor.mouseX, [0, 1], [8, -8]);
  const mileParY = useTransform(cursor.mouseY, [0, 1], [5, -5]);

  /* ── Static layout for reduced-motion ── */
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[350px] h-[400px]">
        <div className="relative" style={{ width: 350, height: 400 }}>
          {/* SVG converging paths */}
          <svg
            className="absolute inset-0"
            width="350"
            height="400"
            viewBox="0 0 350 400"
            fill="none"
          >
            <defs>
              <linearGradient id="pathGradStatic" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="url(#pathGradStatic)"
                strokeWidth="1.5"
                fill="none"
              />
            ))}
          </svg>

          {/* Milestone markers */}
          {MILESTONES.map((m) => (
            <div
              key={m.year}
              className="absolute flex items-center gap-2"
              style={{ left: 175, top: m.y, transform: 'translateX(-50%)' }}
            >
              <div className="w-[10px] h-[10px] rounded-full bg-emerald-400/60" />
              <div
                className={`${GLASS} px-2 py-1 flex items-center gap-1.5`}
                style={{ height: 22 }}
              >
                <span className="text-[9px] text-white/70 font-semibold">{m.year}</span>
                <span className="text-[8px] text-white/40">{m.label}</span>
              </div>
            </div>
          ))}

          {/* Floating glass cards */}
          {FLOATING_CARDS.map((card) => {
            const Icon = ICON_MAP[card.icon];
            return (
              <div
                key={card.icon}
                className={`absolute ${GLASS} flex items-center justify-center`}
                style={{
                  width: 70,
                  height: 50,
                  left: `calc(50% + ${card.x}px)`,
                  top: card.y,
                }}
              >
                <Icon />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Animated layout ── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[350px] h-[400px]">
      <motion.div
        className="relative"
        style={{
          perspective: 900,
          transformStyle: 'preserve-3d',
          width: 350,
          height: 400,
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* SVG converging paths with animated pathLength */}
        <svg
          className="absolute inset-0"
          width="350"
          height="400"
          viewBox="0 0 350 400"
          fill="none"
        >
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {PATHS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="url(#pathGrad)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
                opacity: { duration: 0.3, delay: i * 0.1 },
              }}
            />
          ))}
        </svg>

        {/* Milestone markers */}
        {MILESTONES.map((m) => (
          <motion.div
            key={m.year}
            className="absolute flex items-center gap-2"
            style={{
              left: 175,
              top: m.y,
              translateX: '-50%',
              translateZ: m.z,
              x: cursor.isActive ? mileParX : 0,
              y: cursor.isActive ? mileParY : 0,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: m.delay,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Glowing dot */}
            <div
              className="w-[10px] h-[10px] rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
            />
            {/* Glass label card */}
            <div
              className={`${GLASS} px-2 py-1 flex items-center gap-1.5`}
              style={{ height: 22 }}
            >
              <span className="text-[9px] text-white/70 font-semibold">{m.year}</span>
              <span className="text-[8px] text-white/40">{m.label}</span>
            </div>
          </motion.div>
        ))}

        {/* Floating glass icon cards */}
        {FLOATING_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon];
          const cardParX = useTransform(cursor.mouseX, [0, 1], [4, -4]);
          const cardParY = useTransform(cursor.mouseY, [0, 1], [3, -3]);
          return (
            <motion.div
              key={card.icon}
              className={`absolute ${GLASS} flex items-center justify-center`}
              style={{
                width: 70,
                height: 50,
                left: `calc(50% + ${card.x}px)`,
                top: card.y,
                translateZ: card.z,
                x: cursor.isActive ? cardParX : 0,
                y: cursor.isActive ? cardParY : 0,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: card.delay,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Icon />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export const OurStoryHeroVisual = memo(OurStoryHeroVisualInner);
export default OurStoryHeroVisual;
