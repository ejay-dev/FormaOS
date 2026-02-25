'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * FrameworksHeroVisual — "Framework Stack"
 * ─────────────────────────────────────────
 * 5 compliance framework cards stacked in a cascading fan.
 * Front card is detailed; back cards progressively simpler and blurred.
 * Cursor changes fan angle and tilts the deck via rotateX/Y.
 * Desktop-only, pointer-events-none.
 */

const FRAMEWORKS = [
  {
    name: 'ISO 27001',
    subtitle: 'International Standard',
    accent: 'rgb(16,185,129)',    // emerald
    accentBorder: 'border-emerald-500/20',
    z: 0,
    rotation: 0,
    blur: 0,
    yOffset: 0,
    delay: 0.0,
    detailed: true,
  },
  {
    name: 'SOC 2',
    subtitle: '',
    accent: 'rgb(6,182,212)',     // cyan
    accentBorder: 'border-cyan-500/20',
    z: -15,
    rotation: 4,
    blur: 0.5,
    yOffset: 8,
    delay: 0.12,
    detailed: false,
  },
  {
    name: 'NIST',
    subtitle: '',
    accent: 'rgb(59,130,246)',    // blue
    accentBorder: 'border-blue-500/20',
    z: -30,
    rotation: 8,
    blur: 1,
    yOffset: 16,
    delay: 0.24,
    detailed: false,
  },
  {
    name: 'HIPAA',
    subtitle: '',
    accent: 'rgb(139,92,246)',    // violet
    accentBorder: 'border-violet-500/20',
    z: -45,
    rotation: -4,
    blur: 1.5,
    yOffset: 24,
    delay: 0.36,
    detailed: false,
  },
  {
    name: 'GDPR',
    subtitle: '',
    accent: 'rgb(245,158,11)',    // amber
    accentBorder: 'border-amber-500/20',
    z: -60,
    rotation: -8,
    blur: 2,
    yOffset: 32,
    delay: 0.48,
    detailed: false,
  },
] as const;

const GLASS =
  'rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]';

function FrameworksHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Overall deck tilt (+-3deg)
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-3, 3]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [3, -3]);

  // Cursor X modulates fan spread (multiplier on card rotation)
  const fanMultiplier = useTransform(cursor.mouseX, [0, 1], [0.6, 1.4]);

  /* ── Static layout for reduced-motion ── */
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[350px] h-[300px]">
        <div className="relative" style={{ width: 350, height: 300 }}>
          {[...FRAMEWORKS].reverse().map((fw) => (
            <div
              key={fw.name}
              className={`absolute left-1/2 top-1/2 ${GLASS} ${fw.accentBorder} p-4 flex flex-col items-center justify-center`}
              style={{
                width: 160,
                height: 100,
                transform: `translate(-50%, -50%) translateY(${fw.yOffset}px) rotate(${fw.rotation}deg)`,
                filter: fw.blur > 0 ? `blur(${fw.blur}px)` : undefined,
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full mb-2"
                style={{ backgroundColor: fw.accent }}
              />
              <span className="text-[11px] text-white/80 font-semibold">{fw.name}</span>
              {fw.detailed && (
                <>
                  {/* Shield icon */}
                  <svg
                    className="mt-1.5 text-white/30"
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                  >
                    <path
                      d="M7 1L1 3.5V7.5C1 11 3.5 14 7 15C10.5 14 13 11 13 7.5V3.5L7 1Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[8px] text-white/40 mt-1">{fw.subtitle}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Animated layout ── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[350px] h-[300px]">
      <motion.div
        className="relative"
        style={{
          perspective: 800,
          transformStyle: 'preserve-3d',
          width: 350,
          height: 300,
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* Render back-to-front so front card is on top */}
        {[...FRAMEWORKS].reverse().map((fw) => {
          // Dynamic rotation driven by cursor when active
          const dynamicRotation = cursor.isActive
            ? useTransform(fanMultiplier, (m) => fw.rotation * m)
            : fw.rotation;

          return (
            <motion.div
              key={fw.name}
              className={`absolute left-1/2 top-1/2 ${GLASS} ${fw.accentBorder} p-4 flex flex-col items-center justify-center`}
              style={{
                width: 160,
                height: 100,
                translateX: '-50%',
                translateY: '-50%',
                translateZ: fw.z,
                y: fw.yOffset,
                rotate: dynamicRotation,
                filter: fw.blur > 0 ? `blur(${fw.blur}px)` : undefined,
              }}
              initial={{ rotate: 0, y: 0, opacity: 0, scale: 0.9 }}
              animate={{
                rotate: fw.rotation,
                y: fw.yOffset,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: fw.delay,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Accent dot */}
              <div
                className="w-2.5 h-2.5 rounded-full mb-2 shadow-lg"
                style={{
                  backgroundColor: fw.accent,
                  boxShadow: `0 0 8px ${fw.accent}44`,
                }}
              />
              <span className="text-[11px] text-white/80 font-semibold tracking-wide">
                {fw.name}
              </span>
              {fw.detailed && (
                <>
                  {/* Shield icon */}
                  <svg
                    className="mt-1.5 text-white/30"
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                  >
                    <path
                      d="M7 1L1 3.5V7.5C1 11 3.5 14 7 15C10.5 14 13 11 13 7.5V3.5L7 1Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[8px] text-white/40 mt-1">{fw.subtitle}</span>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export const FrameworksHeroVisual = memo(FrameworksHeroVisualInner);
export default FrameworksHeroVisual;
