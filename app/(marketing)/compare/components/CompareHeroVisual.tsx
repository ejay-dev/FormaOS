'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

interface CompareHeroVisualProps {
  competitor: string;
}

/**
 * CompareHeroVisual
 * ─────────────────
 * Two side-by-side glass panels with "VS" badge.
 * Left: competitor, Right: FormaOS (highlighted).
 * Cursor tilts panels independently.
 */
function CompareHeroVisualInner({ competitor }: CompareHeroVisualProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const cursor = useCursorPosition();

  const leftRotateX = useTransform(cursor.mouseY, [0, 1], [-3, 3]);
  const leftRotateY = useTransform(cursor.mouseX, [0, 1], [3, -3]);
  const rightRotateX = useTransform(cursor.mouseY, [0, 1], [-4, 4]);
  const rightRotateY = useTransform(cursor.mouseX, [0, 1], [4, -4]);

  const panels = [
    {
      label: competitor,
      isForma: false,
      z: -30,
      rotateX: leftRotateX,
      rotateY: leftRotateY,
      borderClass: 'border-white/[0.10]',
      features: [
        { text: 'Compliance scope', hasCheck: false },
        { text: 'Evidence automation', hasCheck: false },
        { text: 'Procurement ready', hasCheck: false },
        { text: 'Audit trail depth', hasCheck: false },
      ],
    },
    {
      label: 'FormaOS',
      isForma: true,
      z: 0,
      rotateX: rightRotateX,
      rotateY: rightRotateY,
      borderClass: 'border-emerald-500/30',
      features: [
        { text: 'Compliance scope', hasCheck: true },
        { text: 'Evidence automation', hasCheck: true },
        { text: 'Procurement ready', hasCheck: true },
        { text: 'Audit trail depth', hasCheck: true },
      ],
    },
  ];

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="hidden lg:flex items-center gap-6">
          {panels.map((p) => (
            <div
              key={p.label}
              className={`w-[180px] h-[220px] rounded-2xl border ${p.borderClass} backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4`}
            >
              <span className={`text-xs font-bold ${p.isForma ? 'text-emerald-400' : 'text-white/50'}`}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:flex items-center gap-0" style={{ perspective: 900 }}>
        {/* Floating group */}
        <motion.div
          className="flex items-center gap-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {panels.map((p, i) => (
            <motion.div
              key={p.label}
              style={{
                translateZ: p.z,
                ...(cursor.isActive ? { rotateX: p.rotateX, rotateY: p.rotateY } : {}),
                transformStyle: 'preserve-3d',
                filter: p.isForma ? undefined : 'blur(0.5px)',
              }}
              initial={sa ? { opacity: 0, x: i === 0 ? -30 : 30, scale: 0.9 } : false}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={sa ? { duration: duration.slower, delay: 0.3 + i * 0.2, ease: signatureEase } : { duration: 0 }}
              className={`w-[180px] h-[220px] xl:w-[200px] xl:h-[240px] rounded-2xl border ${p.borderClass} backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 flex flex-col`}
            >
              {/* Header */}
              <span className={`text-xs font-bold tracking-wide ${p.isForma ? 'text-emerald-400' : 'text-white/50'}`}>
                {p.label}
              </span>

              {/* Feature rows */}
              <div className="mt-4 flex flex-col gap-2.5">
                {p.features.map((f, fi) => (
                  <motion.div
                    key={fi}
                    className="flex items-center gap-2"
                    initial={sa ? { opacity: 0, x: 8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={sa ? { duration: 0.4, delay: 0.8 + i * 0.15 + fi * 0.08, ease: signatureEase } : { duration: 0 }}
                  >
                    {f.hasCheck ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none" stroke="rgba(52,211,153,0.9)" strokeWidth="2">
                          <path d="M2.5 6l2.5 2.5 4.5-5" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                    )}
                    <div className={`h-[3px] rounded-full flex-1 ${p.isForma ? 'bg-emerald-400/20' : 'bg-white/[0.06]'}`} />
                  </motion.div>
                ))}
              </div>

              {/* Score badge */}
              <div className="mt-auto">
                <div className={`text-center text-[10px] font-medium py-1 rounded-lg ${
                  p.isForma
                    ? 'bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20'
                    : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'
                }`}>
                  {p.isForma ? 'Full Coverage' : 'Partial'}
                </div>
              </div>
            </motion.div>
          ))}

          {/* VS badge (positioned between panels) */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            initial={sa ? { opacity: 0, scale: 0.7 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={sa ? { duration: 0.5, delay: 0.6, ease: signatureEase } : { duration: 0 }}
          >
            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-xl flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/60">VS</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export const CompareHeroVisual = memo(CompareHeroVisualInner);
export default CompareHeroVisual;
