'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

interface CompareHeroVisualProps {
  competitor: string;
}

/**
 * CompareHeroVisual
 * ─────────────────
 * Two side-by-side panels: the competitor and FormaOS (emphasised).
 * Restrained entrance only, no cursor tilt, floating loop, or blur chrome.
 */
function CompareHeroVisualInner({ competitor }: CompareHeroVisualProps) {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const panels = [
    {
      label: competitor,
      isForma: false,
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
      borderClass: 'border-white/25',
      features: [
        { text: 'Compliance scope', hasCheck: true },
        { text: 'Evidence automation', hasCheck: true },
        { text: 'Procurement ready', hasCheck: true },
        { text: 'Audit trail depth', hasCheck: true },
      ],
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:flex items-center gap-4 relative">
        {panels.map((p, i) => (
          <motion.div
            key={p.label}
            initial={sa ? { opacity: 0, x: i === 0 ? -24 : 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={
              sa
                ? { duration: duration.slow, delay: 0.2 + i * 0.12, ease: signatureEase }
                : { duration: 0 }
            }
            className={`w-[180px] h-[220px] xl:w-[200px] xl:h-[240px] rounded-2xl border ${p.borderClass} bg-white/[0.04] p-4 flex flex-col`}
          >
            {/* Header */}
            <span className={`text-xs font-bold tracking-wide ${p.isForma ? 'text-white' : 'text-white/50'}`}>
              {p.label}
            </span>

            {/* Feature rows */}
            <div className="mt-4 flex flex-col gap-2.5">
              {p.features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-2">
                  {f.hasCheck ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-white/[0.12] border border-white/30 flex items-center justify-center">
                      <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none" stroke="rgba(226,232,240,0.9)" strokeWidth="2">
                        <path d="M2.5 6l2.5 2.5 4.5-5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                  )}
                  <div className={`h-[3px] rounded-full flex-1 ${p.isForma ? 'bg-white/20' : 'bg-white/[0.06]'}`} />
                </div>
              ))}
            </div>

            {/* Coverage badge */}
            <div className="mt-auto">
              <div className={`text-center text-[10px] font-medium py-1 rounded-lg ${
                p.isForma
                  ? 'bg-white/[0.08] text-white/80 border border-white/20'
                  : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'
              }`}>
                {p.isForma ? 'Full Coverage' : 'Partial'}
              </div>
            </div>
          </motion.div>
        ))}

        {/* VS marker */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          initial={sa ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={sa ? { duration: duration.normal, delay: 0.5, ease: signatureEase } : { duration: 0 }}
        >
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/60">VS</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export const CompareHeroVisual = memo(CompareHeroVisualInner);
export default CompareHeroVisual;
