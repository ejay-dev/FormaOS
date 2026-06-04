'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ─── Data ────────────────────────────────────────────────────── */

const CHECKLIST_ITEMS = [
  'Encryption at rest',
  'Access control policy',
  'Penetration testing',
  'Incident response plan',
  'Vendor risk assessment',
  'Data retention policy',
] as const;

const COMPLETED_COUNT = 4;
const TOTAL_COUNT = CHECKLIST_ITEMS.length;
const PROGRESS_PCT = Math.round((COMPLETED_COUNT / TOTAL_COUNT) * 100);

const BADGES = [
  { label: 'SOC 2', dotColor: 'bg-slate-300', textColor: 'text-slate-300', z: -25, angle: 0, radius: 175 },
  { label: 'ISO 27001', dotColor: 'bg-slate-400', textColor: 'text-slate-400', z: -45, angle: 120, radius: 185 },
  { label: 'HIPAA', dotColor: 'bg-slate-500', textColor: 'text-slate-400', z: -65, angle: 240, radius: 170 },
] as const;

/* ─── Check SVG ───────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="absolute inset-0 m-auto"
    >
      <path
        d="M2 5.5L4 7.5L8 3"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Component ───────────────────────────────────────────────── */

/**
 * SecurityReviewHeroVisual
 * ────────────────────────
 * Review-checklist clipboard ringed by framework badges. Renders the
 * settled state directly, no auto-running check-off telemetry, no
 * orbiting badges, no cursor-reactive tilt (enterprise-restrained).
 * Clipboard + badges fade/scale in once on entrance.
 */
function SecurityReviewHeroVisualInner() {
  const prefersReduced = useReducedMotion();
  const animate = !prefersReduced;

  /* ── Clipboard content (settled state) ──────────────────────── */
  const clipboardContent = (
    <>
      {/* Clipboard handle */}
      <div className="flex justify-center -mt-1 mb-3">
        <div className="w-16 h-3 rounded-full bg-white/[0.08] border border-white/[0.06]" />
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-2.5 px-4">
        {CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = i < COMPLETED_COUNT;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {/* Checkbox */}
              <div className="relative w-3.5 h-3.5 flex-shrink-0">
                {isChecked ? (
                  <div className="w-full h-full rounded-[3px] bg-slate-400/80 border border-white/30">
                    <CheckIcon />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-[3px] border border-white/[0.15] bg-white/[0.04]" />
                )}
              </div>
              {/* Text line */}
              <span
                className={`text-[10px] leading-tight ${isChecked ? 'text-white/50' : 'text-white/30'}`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/40">
            {COMPLETED_COUNT}/{TOTAL_COUNT} Complete
          </span>
          <span className="text-[9px] text-white/30">{PROGRESS_PCT}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slate-400/60 to-slate-300/40"
            style={{ width: `${PROGRESS_PCT}%` }}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[380px] h-[400px] relative">
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
      >
        {/* ── Clipboard ──────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] w-[280px] py-5 shadow-2xl"
          style={{ transformStyle: 'preserve-3d' }}
          initial={animate ? { scale: 0.9, filter: 'blur(8px)', opacity: 0 } : false}
          animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
          transition={animate ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
        >
          {clipboardContent}
        </motion.div>

        {/* ── Framework badges (fixed positions) ─────────────── */}
        {BADGES.map((badge, i) => {
          const rad = ((badge.angle - 90) * Math.PI) / 180;
          const bx = Math.cos(rad) * badge.radius;
          const by = Math.sin(rad) * badge.radius;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2 py-1 flex items-center gap-1.5 shadow-lg"
              style={{
                left: `calc(50% + ${bx}px)`,
                top: `calc(50% + ${by}px)`,
                transformStyle: 'preserve-3d',
                translateZ: badge.z,
                x: '-50%',
                y: '-50%',
              }}
              initial={animate ? { opacity: 0, scale: 0.6 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                animate
                  ? { duration: 0.5, delay: 0.8 + i * 0.15 }
                  : { duration: 0 }
              }
            >
              <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
              <span className={`text-[10px] font-medium ${badge.textColor} whitespace-nowrap`}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */

export const SecurityReviewHeroVisual = memo(SecurityReviewHeroVisualInner);
export default SecurityReviewHeroVisual;
