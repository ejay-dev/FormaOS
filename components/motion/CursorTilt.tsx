'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';

interface CursorTiltProps {
  children: ReactNode;
  /** Max tilt angle in degrees (default: 5) */
  intensity?: number;
  /** Perspective distance in px (default: 1200) */
  perspective?: number;
  /** Spring stiffness (default: 150) */
  stiffness?: number;
  /** Spring damping (default: 20) */
  damping?: number;
  /** Whether to add a subtle glow that follows cursor (default: false) */
  glowFollow?: boolean;
  /** Glow color rgba string (default: '0,212,251') */
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CursorTilt({
  children,
  intensity = 5,
  perspective = 1200,
  stiffness = 150,
  damping = 20,
  glowFollow = false,
  glowColor = '0,212,251',
  className = '',
  style,
}: CursorTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse values (0-1 range, centered at 0.5)
  const mouseX = useSpring(0.5, { stiffness, damping });
  const mouseY = useSpring(0.5, { stiffness, damping });

  // Map mouse position to rotation angles
  const rotateX = useTransform(mouseY, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(mouseX, [0, 1], [-intensity, intensity]);

  // Glow position (percentage)
  const glowX = useTransform(mouseX, [0, 1], [0, 100]);
  const glowY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    },
    [shouldReduceMotion, mouseX, mouseY],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  if (shouldReduceMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective,
        ...style,
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full"
      >
        {children}
        {glowFollow && isHovered && (
          <GlowOverlay glowX={glowX} glowY={glowY} color={glowColor} />
        )}
      </motion.div>
    </motion.div>
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
    [glowX, glowY] as MotionValue[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(${color},0.12) 0%, transparent 60%)`,
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{ background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}

export default CursorTilt;
