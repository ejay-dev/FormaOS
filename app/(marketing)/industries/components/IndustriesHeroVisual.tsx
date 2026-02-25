'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * IndustriesHeroVisual
 * ────────────────────
 * Unique visual for the Industries page hero:
 * - 4 floating sector modules in a diamond layout
 * - Each module has an inline SVG icon + sector name
 * - Independent sine-wave Y floating motion
 * - Staggered fade-in with subtle connecting dotted lines
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */
function IndustriesHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Industry sector modules — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Connecting dotted lines between modules */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 700">
          {CONNECTIONS.map((conn, i) => (
            <motion.line
              key={`conn-${i}`}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="rgba(52,211,153,0.15)"
              strokeWidth="1"
              strokeDasharray="4 6"
              initial={sa ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={sa ? {
                pathLength: { duration: 1.2, delay: 1.0 + i * 0.15, ease: signatureEase },
                opacity: { duration: 0.3, delay: 1.0 + i * 0.15 },
              } : { duration: 0 }}
            />
          ))}
        </svg>

        {/* Sector modules */}
        {SECTOR_MODULES.map((sector, i) => (
          <motion.div
            key={sector.name}
            className="absolute"
            style={{
              left: sector.left,
              top: sector.top,
              transform: 'translate(-50%, -50%)',
            }}
            initial={sa ? { opacity: 0, scale: 0.7, y: 20 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={sa ? {
              duration: duration.slower,
              delay: 0.5 + i * 0.2,
              ease: signatureEase,
            } : { duration: 0 }}
          >
            {/* Floating Y motion wrapper */}
            <motion.div
              animate={sa ? {
                y: [0, sector.floatAmplitude, 0, -sector.floatAmplitude, 0],
              } : undefined}
              transition={sa ? {
                duration: sector.floatDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              } : undefined}
            >
              {/* Glow behind module */}
              <motion.div
                className="absolute -inset-3 rounded-2xl blur-xl"
                style={{ background: `radial-gradient(circle, ${sector.glowColor}, transparent)` }}
                animate={sa ? {
                  opacity: [0.15, 0.3, 0.15],
                } : undefined}
                transition={sa ? {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                } : undefined}
              />

              {/* Glass card */}
              <div className="relative w-[100px] h-[100px] xl:w-[110px] xl:h-[110px] rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                {/* Icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 xl:w-8 xl:h-8"
                  fill="none"
                  stroke={sector.iconColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {sector.iconPaths.map((d, pi) => (
                    <path key={pi} d={d} />
                  ))}
                </svg>

                {/* Sector name */}
                <span className="text-[9px] xl:text-[10px] font-medium text-white/50 tracking-wider uppercase">
                  {sector.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Data ───

const SECTOR_MODULES = [
  {
    name: 'Healthcare',
    left: '50%',
    top: '28%',
    iconColor: 'rgba(52,211,153,0.7)',
    glowColor: 'rgba(52,211,153,0.1)',
    floatAmplitude: -8,
    floatDuration: 5.5,
    // Heart icon
    iconPaths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  {
    name: 'Finance',
    left: '72%',
    top: '50%',
    iconColor: 'rgba(59,130,246,0.7)',
    glowColor: 'rgba(59,130,246,0.1)',
    floatAmplitude: 10,
    floatDuration: 6.2,
    // Bar chart icon
    iconPaths: [
      'M18 20V10',
      'M12 20V4',
      'M6 20v-6',
    ],
  },
  {
    name: 'Government',
    left: '50%',
    top: '72%',
    iconColor: 'rgba(34,211,238,0.7)',
    glowColor: 'rgba(34,211,238,0.1)',
    floatAmplitude: -6,
    floatDuration: 7.0,
    // Building / Institution icon
    iconPaths: [
      'M3 21h18',
      'M5 21V7l7-4 7 4v14',
      'M9 21v-6h6v6',
      'M9 10h1',
      'M14 10h1',
    ],
  },
  {
    name: 'Education',
    left: '28%',
    top: '50%',
    iconColor: 'rgba(139,92,246,0.7)',
    glowColor: 'rgba(139,92,246,0.1)',
    floatAmplitude: 7,
    floatDuration: 5.8,
    // Graduation cap icon
    iconPaths: [
      'M22 10l-10-5L2 10l10 5 10-5z',
      'M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5',
      'M22 10v6',
    ],
  },
];

// Diamond layout connection lines (in 700x700 viewBox coordinates)
// top=196, right=504/350, bottom=504, left=196/350
const CONNECTIONS = [
  { x1: 350, y1: 196, x2: 504, y2: 350 },   // Healthcare -> Finance
  { x1: 504, y1: 350, x2: 350, y2: 504 },   // Finance -> Government
  { x1: 350, y1: 504, x2: 196, y2: 350 },   // Government -> Education
  { x1: 196, y1: 350, x2: 350, y2: 196 },   // Education -> Healthcare
];

export const IndustriesHeroVisual = memo(IndustriesHeroVisualInner);
export default IndustriesHeroVisual;
