'use client';

import { memo, useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useInView,
  type MotionValue,
} from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
import { easing, duration } from '@/config/motion';
import { useDeviceTier } from '@/lib/device-tier';

const signatureEase = [...easing.signature] as [number, number, number, number];

// ─── Sector data ───

interface Sector {
  name: string;
  angle: number; // position on orbital ring (degrees)
  z: number; // translateZ depth
  iconColor: string;
  glowColor: string;
  iconPaths: string[];
}

const SECTORS: Sector[] = [
  {
    name: 'Healthcare',
    angle: -90, // top
    z: -20,
    iconColor: 'rgba(52,211,153,0.8)',
    glowColor: 'rgba(52,211,153,0.12)',
    iconPaths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  {
    name: 'Finance',
    angle: 0, // right
    z: 0,
    iconColor: 'rgba(59,130,246,0.8)',
    glowColor: 'rgba(59,130,246,0.12)',
    iconPaths: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  },
  {
    name: 'Government',
    angle: 90, // bottom
    z: -40,
    iconColor: 'rgba(34,211,238,0.8)',
    glowColor: 'rgba(34,211,238,0.12)',
    iconPaths: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6', 'M9 10h1', 'M14 10h1'],
  },
  {
    name: 'Education',
    angle: 180, // left
    z: -10,
    iconColor: 'rgba(139,92,246,0.8)',
    glowColor: 'rgba(139,92,246,0.12)',
    iconPaths: ['M22 10l-10-5L2 10l10 5 10-5z', 'M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5', 'M22 10v6'],
  },
];

const ORBIT_RADIUS = 170; // px from center
const TILE_SIZE = 130; // px

/**
 * IndustriesHeroVisual
 * ────────────────────
 * 4 sector glass tiles in a 3D orbital ring with slow auto-rotation.
 * Cursor tilts the orbital plane. Tiles at different Z depths.
 */
function IndustriesHeroVisualInner() {
  const visualRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const isInView = useInView(visualRef, { amount: 0.2 });
  const allowOrbitMotion =
    !shouldReduceMotion &&
    tierConfig.tier === 'high' &&
    !tierConfig.isTouch &&
    isInView;
  const sa = allowOrbitMotion;
  const cursor = useCursorPosition();

  // Slow auto-rotation angle (degrees)
  const orbitAngle = useMotionValue(0);
  const speedRef = useRef(0.12); // degrees per frame (~30s per orbit at 60fps)

  useAnimationFrame((_, delta) => {
    if (!allowOrbitMotion) return;
    orbitAngle.set(orbitAngle.get() + speedRef.current * (delta / 16.67));
  });

  // Cursor-reactive tilt on the orbital plane
  const tiltX = useTransform(cursor.mouseY, [0, 1], [-4, 4]);
  const tiltY = useTransform(cursor.mouseX, [0, 1], [4, -4]);

  if (!allowOrbitMotion) {
    return (
      <div
        ref={visualRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <div className="hidden lg:block relative w-[550px] h-[400px] xl:w-[600px] xl:h-[440px]">
          {SECTORS.map((sector) => {
            const rad = (sector.angle * Math.PI) / 180;
            const x = Math.cos(rad) * ORBIT_RADIUS;
            const y = Math.sin(rad) * ORBIT_RADIUS * 0.5; // Flatten Y for perspective
            return (
              <div
                key={sector.name}
                className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex flex-col items-center justify-center gap-2"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  left: `calc(50% + ${x}px - ${TILE_SIZE / 2}px)`,
                  top: `calc(50% + ${y}px - ${TILE_SIZE / 2}px)`,
                }}
              >
                <SectorIcon sector={sector} />
                <span className="text-[10px] font-medium text-white/50 tracking-wider uppercase">{sector.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={visualRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    >
      <div className="hidden lg:flex items-center justify-center relative w-[550px] h-[400px] xl:w-[600px] xl:h-[440px]">
        {/* 3D orbital container */}
        <motion.div
          style={{
            perspective: 900,
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full h-full"
        >
          {/* Orbital plane — tilts with cursor */}
          <motion.div
            style={{
              ...(cursor.isActive ? { rotateX: tiltX, rotateY: tiltY } : {}),
              transformStyle: 'preserve-3d',
            }}
            className="absolute inset-0"
          >
            {/* Connecting ring (SVG circle) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 440">
              <ellipse
                cx="300"
                cy="220"
                rx={ORBIT_RADIUS}
                ry={ORBIT_RADIUS * 0.5}
                fill="none"
                stroke="rgba(52,211,153,0.08)"
                strokeWidth="1"
                strokeDasharray="6 8"
              />
            </svg>

            {/* Sector tiles */}
            {SECTORS.map((sector, i) => (
              <SectorTile
                key={sector.name}
                sector={sector}
                index={i}
                orbitAngle={orbitAngle}
                cursor={cursor}
                sa={sa}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/** Individual sector tile positioned on the orbital ring */
function SectorTile({
  sector,
  index,
  orbitAngle,
  cursor,
  sa,
}: {
  sector: Sector;
  index: number;
  orbitAngle: MotionValue<number>;
  cursor: ReturnType<typeof useCursorPosition>;
  sa: boolean;
}) {
  // Position on orbital ring (base angle + auto-rotation)
  const x = useTransform(orbitAngle, (angle: number) => {
    const rad = ((sector.angle + angle) * Math.PI) / 180;
    return Math.cos(rad) * ORBIT_RADIUS;
  });
  const y = useTransform(orbitAngle, (angle: number) => {
    const rad = ((sector.angle + angle) * Math.PI) / 180;
    return Math.sin(rad) * ORBIT_RADIUS * 0.5; // Flatten for perspective
  });

  // Micro-rotation per tile from cursor
  const microRotateX = useTransform(cursor.mouseY, [0, 1], [-2, 2]);
  const microRotateY = useTransform(cursor.mouseX, [0, 1], [2, -2]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        x,
        y,
        translateZ: sector.z,
        marginLeft: -TILE_SIZE / 2,
        marginTop: -TILE_SIZE / 2,
        ...(cursor.isActive ? { rotateX: microRotateX, rotateY: microRotateY } : {}),
        transformStyle: 'preserve-3d',
      }}
      initial={sa ? { opacity: 0, scale: 0.7 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={sa ? {
        duration: duration.slower,
        delay: 0.4 + index * 0.18,
        ease: signatureEase,
      } : { duration: 0 }}
    >
      {/* Glow behind tile */}
      <motion.div
        className="absolute -inset-4 rounded-2xl blur-xl"
        style={{ background: `radial-gradient(circle, ${sector.glowColor}, transparent)` }}
        animate={sa ? { opacity: [0.15, 0.35, 0.15] } : undefined}
        transition={sa ? { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 } : undefined}
      />

      {/* Glass tile */}
      <div
        className="relative rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex flex-col items-center justify-center gap-3"
        style={{ width: TILE_SIZE, height: TILE_SIZE }}
      >
        <SectorIcon sector={sector} />
        <span className="text-[10px] xl:text-[11px] font-semibold text-white/55 tracking-wider uppercase">
          {sector.name}
        </span>
      </div>
    </motion.div>
  );
}

/** Sector SVG icon */
function SectorIcon({ sector }: { sector: Sector }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-9 h-9 xl:w-10 xl:h-10"
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
  );
}

export const IndustriesHeroVisual = memo(IndustriesHeroVisualInner);
export default IndustriesHeroVisual;
