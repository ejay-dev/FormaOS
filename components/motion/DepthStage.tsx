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
 * Wraps children in a perspective + preserve-3d context.
 * Optional cursor-following tilt (rotateX/rotateY) for interactive depth.
 *
 * Use with DepthLayer children to create multi-layer parallax depth.
 *
 * Performance:
 *  - Transform-only animations (GPU-accelerated)
 *  - Spring physics via useSpring (no layout thrashing)
 *  - Cursor tracking deferred via requestIdleCallback
 *  - Desktop-only tilt (disabled on <1024px and reduced-motion)
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
  const [tiltEnabled, setTiltEnabled] = useState(false);

  // Spring-animated mouse position (0-1 range)
  const mouseX = useSpring(0.5, { stiffness, damping });
  const mouseY = useSpring(0.5, { stiffness, damping });

  // Map mouse position to tilt angles
  const rotateX = useTransform(mouseY, [0, 1], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(mouseX, [0, 1], [-tiltIntensity, tiltIntensity]);

  // Glow position (percentage)
  const glowX = useTransform(mouseX, [0, 1], [0, 100]);
  const glowY = useTransform(mouseY, [0, 1], [0, 100]);

  // Viewport gate: only enable tilt on desktop
  useEffect(() => {
    if (shouldReduceMotion || !cursorTilt) return;

    const updateGate = () => setTiltEnabled(window.innerWidth >= 1024);

    // Defer initial check to avoid blocking first paint
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(updateGate);
    } else {
      setTimeout(updateGate, 100);
    }

    window.addEventListener('resize', updateGate);
    return () => window.removeEventListener('resize', updateGate);
  }, [shouldReduceMotion, cursorTilt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [tiltEnabled, mouseX, mouseY],
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // Cursor context value — exposed to children (HeroVisuals, etc.)
  const cursorCtx = { mouseX, mouseY, isActive: tiltEnabled };

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
            ...(tiltEnabled ? { rotateX, rotateY } : {}),
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full h-full"
        >
          {children}

          {/* Cursor-following glow overlay */}
          {glowFollow && tiltEnabled && isHovered && (
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
