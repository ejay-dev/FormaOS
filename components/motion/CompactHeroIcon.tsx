'use client';

import { useRef, useCallback, memo, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';

interface CompactHeroIconProps {
  /** Lucide icon element or any ReactNode */
  icon: ReactNode;
  /** Glow color as R,G,B string (default: '34,211,238' = cyan) */
  color?: string;
  /** Icon container size in px (default: 80) */
  size?: number;
}

/**
 * CompactHeroIcon
 * ───────────────
 * Floating 3D glass icon for CompactHero pages.
 * Self-contained cursor tracking (doesn't require DepthStage).
 * Gentle tilt on hover with glass morphism container.
 */
function CompactHeroIconInner({ icon, color = '34,211,238', size = 80 }: CompactHeroIconProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const localX = useMotionValue(0.5);
  const localY = useMotionValue(0.5);
  const smoothX = useSpring(localX, { stiffness: 180, damping: 22 });
  const smoothY = useSpring(localY, { stiffness: 180, damping: 22 });

  const rotateX = useTransform(smoothY, [0, 1], [6, -6]);
  const rotateY = useTransform(smoothX, [0, 1], [-6, 6]);
  const lightGradient = useTransform(
    [smoothX, smoothY] as MotionValue<number>[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(${color},0.15) 0%, transparent 60%)`,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      localX.set((e.clientX - rect.left) / rect.width);
      localY.set((e.clientY - rect.top) / rect.height);
    },
    [shouldReduceMotion, localX, localY],
  );

  const handleMouseLeave = useCallback(() => {
    localX.set(0.5);
    localY.set(0.5);
  }, [localX, localY]);

  if (shouldReduceMotion) {
    return (
      <div
        className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {icon}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 600, width: size, height: size }}
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full h-full rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center overflow-hidden"
      >
        {/* Floating animation */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>

        {/* Light sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{ background: lightGradient } as Record<string, unknown>}
        />

        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow: `0 0 30px rgba(${color},0.08), inset 0 0 20px rgba(${color},0.04)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export const CompactHeroIcon = memo(CompactHeroIconInner);
export default CompactHeroIcon;
