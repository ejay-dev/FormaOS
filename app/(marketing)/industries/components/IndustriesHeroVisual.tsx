'use client';

import { memo } from 'react';

// ─── Sector data ───

interface Sector {
  name: string;
  angle: number; // position on the ring (degrees)
  iconColor: string;
  iconPaths: string[];
}

const SECTORS: Sector[] = [
  {
    name: 'Healthcare',
    angle: -90, // top
    iconColor: 'rgba(203,213,225,0.8)',
    iconPaths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  {
    name: 'Finance',
    angle: 0, // right
    iconColor: 'rgba(148,163,184,0.8)',
    iconPaths: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  },
  {
    name: 'Government',
    angle: 90, // bottom
    iconColor: 'rgba(113,113,122,0.8)',
    iconPaths: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6', 'M9 10h1', 'M14 10h1'],
  },
  {
    name: 'Education',
    angle: 180, // left
    iconColor: 'rgba(100,116,139,0.8)',
    iconPaths: ['M22 10l-10-5L2 10l10 5 10-5z', 'M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5', 'M22 10v6'],
  },
];

const ORBIT_RADIUS = 170; // px from center
const TILE_SIZE = 130; // px

/**
 * IndustriesHeroVisual
 * ────────────────────
 * Four sector glass tiles arranged on a flat ring. Static, restrained —
 * no auto-rotation, cursor tilt, or pulsing glow.
 */
function IndustriesHeroVisualInner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:block relative w-[550px] h-[400px] xl:w-[600px] xl:h-[440px]">
        {/* Connecting ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 440">
          <ellipse
            cx="300"
            cy="220"
            rx={ORBIT_RADIUS}
            ry={ORBIT_RADIUS * 0.5}
            fill="none"
            stroke="rgba(148,163,184,0.08)"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
        </svg>

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
              <span className="text-[10px] font-medium text-white/55 tracking-wider uppercase">
                {sector.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
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
