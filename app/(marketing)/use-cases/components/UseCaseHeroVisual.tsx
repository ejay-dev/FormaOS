'use client';

import { memo, type ReactNode } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

interface UseCaseHeroVisualProps {
  icon: ReactNode;
  steps: string[];
}

const STEP_POSITIONS = [
  { angle: -60, z: -15, color: 'rgba(52,211,153,0.6)' },
  { angle: 30, z: -30, color: 'rgba(34,211,238,0.6)' },
  { angle: 150, z: -20, color: 'rgba(59,130,246,0.6)' },
  { angle: -150, z: -40, color: 'rgba(139,92,246,0.6)' },
];

const STEP_RADIUS = 150;

/**
 * UseCaseHeroVisual
 * ─────────────────
 * Large glass tile with use-case icon + floating workflow step badges.
 * Connecting lines from badges to center.
 */
function UseCaseHeroVisualInner({ icon, steps }: UseCaseHeroVisualProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const cursor = useCursorPosition();

  const tiltX = useTransform(cursor.mouseY, [0, 1], [-3, 3]);
  const tiltY = useTransform(cursor.mouseX, [0, 1], [3, -3]);

  const visibleSteps = steps.slice(0, 4);

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="hidden lg:flex items-center justify-center relative w-[450px] h-[350px]">
          <div className="w-[120px] h-[120px] rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:flex items-center justify-center relative w-[450px] h-[350px] xl:w-[500px] xl:h-[380px]">
        <div style={{ perspective: 800, transformStyle: 'preserve-3d' }} className="relative w-full h-full">
          <motion.div
            style={{
              ...(cursor.isActive ? { rotateX: tiltX, rotateY: tiltY } : {}),
              transformStyle: 'preserve-3d',
            }}
            className="absolute inset-0"
          >
            {/* Connecting lines SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 380">
              {visibleSteps.map((_, i) => {
                const pos = STEP_POSITIONS[i];
                const rad = (pos.angle * Math.PI) / 180;
                const x = 250 + Math.cos(rad) * STEP_RADIUS;
                const y = 190 + Math.sin(rad) * STEP_RADIUS * 0.65;
                return (
                  <motion.line
                    key={i}
                    x1={250}
                    y1={190}
                    x2={x}
                    y2={y}
                    stroke="rgba(52,211,153,0.12)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    initial={sa ? { pathLength: 0, opacity: 0 } : undefined}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={sa ? { duration: 0.8, delay: 0.6 + i * 0.15, ease: signatureEase } : undefined}
                  />
                );
              })}
            </svg>

            {/* Central icon tile */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              initial={sa ? { opacity: 0, scale: 0.8 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={sa ? { duration: duration.slower, delay: 0.2, ease: signatureEase } : { duration: 0 }}
            >
              {/* Glow */}
              <motion.div
                className="absolute -inset-6 rounded-3xl bg-emerald-500/10 blur-2xl"
                animate={sa ? { opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] } : undefined}
                transition={sa ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
              />
              <div className="relative w-[120px] h-[120px] rounded-2xl border border-emerald-500/20 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center">
                {icon}
              </div>
            </motion.div>

            {/* Floating step badges */}
            {visibleSteps.map((step, i) => {
              const pos = STEP_POSITIONS[i];
              const rad = (pos.angle * Math.PI) / 180;
              const x = Math.cos(rad) * STEP_RADIUS;
              const y = Math.sin(rad) * STEP_RADIUS * 0.65;

              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    x,
                    y,
                    translateZ: pos.z,
                    marginLeft: -55,
                    marginTop: -14,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={sa ? { opacity: 0, scale: 0.8 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={sa ? { duration: 0.6, delay: 0.5 + i * 0.15, ease: signatureEase } : { duration: 0 }}
                >
                  <motion.div
                    animate={sa ? { y: [0, -4 - i * 0.5, 0] } : undefined}
                    transition={sa ? { duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  >
                    <div className="px-3 py-1.5 rounded-xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center gap-2 whitespace-nowrap">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pos.color }} />
                      <span className="text-[10px] text-white/50 font-medium">{step}</span>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export const UseCaseHeroVisual = memo(UseCaseHeroVisualInner);
export default UseCaseHeroVisual;
