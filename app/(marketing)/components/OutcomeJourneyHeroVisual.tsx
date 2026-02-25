'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

interface OutcomeJourneyHeroVisualProps {
  journeyKey: 'evaluate' | 'prove' | 'operate' | 'govern';
}

const JOURNEY_STAGES = [
  { key: 'evaluate', label: 'Evaluate', color: 'rgba(34,211,238,0.8)' },
  { key: 'prove', label: 'Prove', color: 'rgba(52,211,153,0.7)' },
  { key: 'operate', label: 'Operate', color: 'rgba(59,130,246,0.7)' },
  { key: 'govern', label: 'Govern', color: 'rgba(139,92,246,0.7)' },
];

/**
 * OutcomeJourneyHeroVisual
 * ────────────────────────
 * Horizontal journey path with 4 nodes.
 * Current stage is large + glowing, others smaller/dimmer.
 * Animated connecting path line between nodes.
 */
function OutcomeJourneyHeroVisualInner({ journeyKey }: OutcomeJourneyHeroVisualProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const cursor = useCursorPosition();

  const tiltX = useTransform(cursor.mouseY, [0, 1], [-3, 3]);
  const tiltY = useTransform(cursor.mouseX, [0, 1], [3, -3]);

  const activeIdx = JOURNEY_STAGES.findIndex((s) => s.key === journeyKey);

  const NODE_SPACING = 110;
  const totalWidth = NODE_SPACING * 3;
  const startX = -totalWidth / 2;

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="hidden lg:flex items-center justify-center relative w-[500px] h-[200px]">
          {JOURNEY_STAGES.map((stage, i) => {
            const isActive = i === activeIdx;
            const x = startX + i * NODE_SPACING;
            return (
              <div
                key={stage.key}
                className="absolute flex flex-col items-center"
                style={{ left: `calc(50% + ${x}px)`, top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div
                  className={`rounded-full border flex items-center justify-center ${
                    isActive
                      ? 'w-[70px] h-[70px] border-cyan-400/30 bg-gradient-to-br from-white/[0.10] to-white/[0.04]'
                      : 'w-[44px] h-[44px] border-white/[0.10] bg-gradient-to-br from-white/[0.06] to-white/[0.02]'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                </div>
                <span className={`mt-2 text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:flex items-center justify-center relative w-[500px] h-[250px] xl:w-[550px]">
        <div style={{ perspective: 800, transformStyle: 'preserve-3d' }} className="relative w-full h-full">
          <motion.div
            style={{
              ...(cursor.isActive ? { rotateX: tiltX, rotateY: tiltY } : {}),
              transformStyle: 'preserve-3d',
            }}
            className="absolute inset-0"
          >
            {/* Connecting path line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 550 250">
              <motion.line
                x1={550 / 2 + startX + 22}
                y1={125}
                x2={550 / 2 + startX + totalWidth - 22}
                y2={125}
                stroke="rgba(34,211,238,0.15)"
                strokeWidth="2"
                strokeDasharray="6 4"
                initial={sa ? { pathLength: 0, opacity: 0 } : undefined}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={sa ? { duration: 1, delay: 0.3, ease: signatureEase } : undefined}
              />
              {/* Progress fill up to active node */}
              <motion.line
                x1={550 / 2 + startX + 22}
                y1={125}
                x2={550 / 2 + startX + activeIdx * NODE_SPACING}
                y2={125}
                stroke="rgba(34,211,238,0.4)"
                strokeWidth="2"
                initial={sa ? { pathLength: 0 } : undefined}
                animate={{ pathLength: 1 }}
                transition={sa ? { duration: 0.8, delay: 0.8, ease: signatureEase } : undefined}
              />
            </svg>

            {/* Journey nodes */}
            {JOURNEY_STAGES.map((stage, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              const x = startX + i * NODE_SPACING;
              const z = isActive ? 0 : -20 - i * 10;

              return (
                <motion.div
                  key={stage.key}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: '50%',
                    translateX: '-50%',
                    translateY: '-50%',
                    translateZ: z,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={sa ? { opacity: 0, scale: 0.6 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={sa ? { duration: 0.6, delay: 0.4 + i * 0.12, ease: signatureEase } : { duration: 0 }}
                >
                  {/* Glow for active */}
                  {isActive && (
                    <motion.div
                      className="absolute -inset-4 rounded-full blur-xl"
                      style={{ backgroundColor: 'rgba(34,211,238,0.12)' }}
                      animate={sa ? { opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] } : undefined}
                      transition={sa ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
                    />
                  )}

                  {/* Float animation */}
                  <motion.div
                    animate={sa ? { y: [0, isActive ? -6 : -3, 0] } : undefined}
                    transition={sa ? { duration: isActive ? 3.5 : 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' } : undefined}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`rounded-full border backdrop-blur-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'w-[70px] h-[70px] border-cyan-400/30 bg-gradient-to-br from-white/[0.12] to-white/[0.04]'
                          : isPast
                            ? 'w-[48px] h-[48px] border-emerald-400/20 bg-gradient-to-br from-white/[0.08] to-white/[0.02]'
                            : 'w-[44px] h-[44px] border-white/[0.10] bg-gradient-to-br from-white/[0.06] to-white/[0.02]'
                      }`}
                    >
                      {isPast ? (
                        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div
                          className={`rounded-full ${isActive ? 'w-4 h-4' : 'w-3 h-3'}`}
                          style={{ backgroundColor: stage.color }}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-[10px] font-medium whitespace-nowrap ${
                        isActive ? 'text-white/80' : isPast ? 'text-emerald-300/60' : 'text-white/40'
                      }`}
                    >
                      {stage.label}
                    </span>
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

export const OutcomeJourneyHeroVisual = memo(OutcomeJourneyHeroVisualInner);
export default OutcomeJourneyHeroVisual;
