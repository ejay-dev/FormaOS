'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { CursorContext } from './CursorContext';
import { useDeviceTier } from '@/lib/device-tier';

interface DepthStageProps {
  children: ReactNode;
  /** Perspective distance in px (default: 1200) */
  perspective?: number;
  /** Enable cursor-following 3D tilt (default: true) */
  cursorTilt?: boolean;
  /** Max tilt angle in degrees (default: 5) */
  tiltIntensity?: number;
  /** Spring stiffness for cursor tracking (default: 150) */
  stiffness?: number;
  /** Spring damping for cursor tracking (default: 20) */
  damping?: number;
  /** Whether to show cursor-following glow overlay (default: false) */
  glowFollow?: boolean;
  /** Glow color as R,G,B string (default: '34,211,238') */
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DepthStage
 * ──────────
 * 3D perspective container that enables true depth composition.
 * Desktop: cursor-following tilt. Mobile: slow auto-drift tilt.
 *
 * Performance:
 *  - Transform-only animations (GPU-accelerated)
 *  - Spring physics via useSpring (no layout thrashing)
 *  - Tier-aware intensity scaling
 */
export function DepthStage({
  children,
  perspective = 1200,
  cursorTilt = true,
  tiltIntensity = 5,
  stiffness = 150,
  damping = 20,
  glowFollow = false,
  glowColor = '34,211,238',
  className = '',
  style,
}: DepthStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const tierConfig = useDeviceTier();
  const driftRef = useRef<number>(0);

  // Scale tilt intensity by tier
  const effectiveIntensity = tiltIntensity * tierConfig.parallaxIntensity;
  // Mobile auto-drift uses much smaller tilt
  const mobileTiltIntensity = effectiveIntensity * 0.4;

  // Determine if any tilt should be active
  const tiltActive = cursorTilt && !shouldReduceMotion && tierConfig.tier !== 'low';

  // Spring-animated mouse position (0-1 range)
  const mouseX = useSpring(0.5, { stiffness, damping });
  const mouseY = useSpring(0.5, { stiffness, damping });

  // Map mouse position to tilt angles — use smaller intensity for mobile
  const maxTilt = tierConfig.cursorTilt ? effectiveIntensity : mobileTiltIntensity;
  const rotateX = useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]);

  // Glow position (percentage)
  const glowX = useTransform(mouseX, [0, 1], [0, 100]);
  const glowY = useTransform(mouseY, [0, 1], [0, 100]);

  useEffect(() => {
    if (!tiltActive) return;

    // Desktop: cursor-linked
    if (tierConfig.cursorTilt) {
      return; // handled via onMouseMove below
    }

    // Mobile: slow auto-drift animation
    if (tierConfig.autoDrift) {
      let rafId: number;
      const drift = () => {
        driftRef.current += 0.004;
        mouseX.set(0.5 + Math.sin(driftRef.current) * 0.12);
        mouseY.set(0.5 + Math.cos(driftRef.current * 0.6) * 0.08);
        rafId = requestAnimationFrame(drift);
      };
      rafId = requestAnimationFrame(drift);
      return () => cancelAnimationFrame(rafId);
    }
  }, [tiltActive, tierConfig.cursorTilt, tierConfig.autoDrift, mouseX, mouseY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tierConfig.cursorTilt || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [tierConfig.cursorTilt, mouseX, mouseY],
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // Cursor context value — exposed to children (HeroVisuals, etc.)
  const cursorCtx = { mouseX, mouseY, isActive: tiltActive };

  // Reduced motion: render without any transforms
  if (shouldReduceMotion) {
    return (
      <CursorContext.Provider value={cursorCtx}>
        <div className={`relative ${className}`} style={style}>
          {children}
        </div>
      </CursorContext.Provider>
    );
  }

  return (
    <CursorContext.Provider value={cursorCtx}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective,
          ...style,
        }}
        className={`relative ${className}`}
      >
        <motion.div
          style={{
            ...(tiltActive ? { rotateX, rotateY } : {}),
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full h-full"
        >
          {children}

          {/* Cursor-following glow overlay — desktop only */}
          {glowFollow && tierConfig.cursorTilt && tiltActive && isHovered && (
            <GlowOverlay glowX={glowX} glowY={glowY} color={glowColor} />
          )}
        </motion.div>
      </motion.div>
    </CursorContext.Provider>
  );
}

/** Internal glow overlay that follows cursor position */
function GlowOverlay({
  glowX,
  glowY,
  color,
}: {
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  color: string;
}) {
  const background = useTransform(
    [glowX, glowY] as MotionValue<number>[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(${color},0.1) 0%, transparent 55%)`,
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-[inherit] z-50"
      style={{ background } as Record<string, unknown>}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}

export default DepthStage;
