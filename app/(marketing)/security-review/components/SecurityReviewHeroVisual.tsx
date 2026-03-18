'use client';

import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

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
  {
    label: 'SOC 2',
    dotColor: 'bg-emerald-400',
    textColor: 'text-emerald-300',
    z: -25,
    angle: 0,
    radius: 175,
    speed: 20,
  },
  {
    label: 'ISO 27001',
    dotColor: 'bg-cyan-400',
    textColor: 'text-cyan-300',
    z: -45,
    angle: 120,
    radius: 185,
    speed: 26,
  },
  {
    label: 'HIPAA',
    dotColor: 'bg-blue-400',
    textColor: 'text-blue-300',
    z: -65,
    angle: 240,
    radius: 170,
    speed: 32,
  },
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

function SecurityReviewHeroVisualInner() {
  const prefersReduced = useReducedMotion();
  const cursor = useCursorPosition();
  const [mounted, setMounted] = useState(false);
  const [checkedItems, setCheckedItems] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Stagger check-off animation */
  useEffect(() => {
    if (!mounted || prefersReduced) {
      if (prefersReduced) setCheckedItems(COMPLETED_COUNT);
      return;
    }
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setCheckedItems(count);
      if (count >= COMPLETED_COUNT) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [mounted, prefersReduced]);

  /* Cursor tilt (±4°) */
  const rotateX = useTransform(cursor.mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-4, 4]);

  /* Badge parallax */
  const badgeParallaxX = useTransform(cursor.mouseX, [0, 1], [-8, 8]);
  const badgeParallaxY = useTransform(cursor.mouseY, [0, 1], [-8, 8]);

  /* ── Clipboard content (shared) ─────────────────────────────── */
  const clipboardContent = (
    <>
      {/* Clipboard handle */}
      <div className="flex justify-center -mt-1 mb-3">
        <div className="w-16 h-3 rounded-full bg-white/[0.08] border border-white/[0.06]" />
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-2.5 px-4">
        {CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = i < checkedItems;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {/* Checkbox */}
              <div className="relative w-3.5 h-3.5 flex-shrink-0">
                {isChecked ? (
                  <motion.div
                    className="w-full h-full rounded-[3px] bg-emerald-500/80 border border-emerald-400/40"
                    initial={prefersReduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                    }}
                  >
                    <CheckIcon />
                  </motion.div>
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
            {Math.min(checkedItems, COMPLETED_COUNT)}/{TOTAL_COUNT} Complete
          </span>
          <span className="text-[9px] text-white/30">
            {Math.min(checkedItems, COMPLETED_COUNT) === COMPLETED_COUNT
              ? PROGRESS_PCT
              : Math.round(
                  (Math.min(checkedItems, COMPLETED_COUNT) / TOTAL_COUNT) * 100,
                )}
            %
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40"
            initial={prefersReduced ? { width: `${PROGRESS_PCT}%` } : { width: '0%' }}
            animate={{
              width: `${Math.round((Math.min(checkedItems, COMPLETED_COUNT) / TOTAL_COUNT) * 100)}%`,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </>
  );

  /* ── Reduced-motion: static layout ──────────────────────────── */
  if (prefersReduced) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[380px] h-[400px] relative">
        {/* Clipboard */}
        <div className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] w-[280px] py-5">
          {clipboardContent}
        </div>

        {/* Badges */}
        {BADGES.map((badge, i) => {
          const rad = ((badge.angle - 90) * Math.PI) / 180;
          const bx = Math.cos(rad) * badge.radius;
          const by = Math.sin(rad) * badge.radius;
          return (
            <div
              key={i}
              className="absolute rounded-full border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2 py-1 flex items-center gap-1.5"
              style={{
                left: `calc(50% + ${bx}px)`,
                top: `calc(50% + ${by}px)`,
                transform: `translate(-50%, -50%) translateZ(${badge.z}px)`,
              }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
              <span className={`text-[10px] font-medium ${badge.textColor}`}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Animated layout ────────────────────────────────────────── */
  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[380px] h-[400px] relative">
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: '900px',
          transformStyle: 'preserve-3d',
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* ── Clipboard ──────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] w-[280px] py-5 shadow-2xl"
          style={{ transformStyle: 'preserve-3d' }}
          initial={{ scale: 0.9, filter: 'blur(8px)', opacity: 0 }}
          animate={
            mounted
              ? { scale: 1, filter: 'blur(0px)', opacity: 1 }
              : undefined
          }
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {clipboardContent}
        </motion.div>

        {/* ── Orbiting badges ────────────────────────────────── */}
        {BADGES.map((badge, i) => {
          const depthScale = Math.abs(badge.z) / 65;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2 py-1 flex items-center gap-1.5 shadow-lg"
              style={{
                transformStyle: 'preserve-3d',
                translateZ: badge.z,
                x: cursor.isActive
                  ? useTransform(badgeParallaxX, (v) => v * depthScale)
                  : 0,
                y: cursor.isActive
                  ? useTransform(badgeParallaxY, (v) => v * depthScale)
                  : 0,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={
                mounted
                  ? {
                      opacity: 1,
                      scale: 1,
                      left: [
                        `calc(50% + ${Math.cos(((badge.angle - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.cos(((badge.angle + 90 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.cos(((badge.angle + 180 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.cos(((badge.angle + 270 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.cos(((badge.angle + 360 - 90) * Math.PI) / 180) * badge.radius}px)`,
                      ],
                      top: [
                        `calc(50% + ${Math.sin(((badge.angle - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.sin(((badge.angle + 90 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.sin(((badge.angle + 180 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.sin(((badge.angle + 270 - 90) * Math.PI) / 180) * badge.radius}px)`,
                        `calc(50% + ${Math.sin(((badge.angle + 360 - 90) * Math.PI) / 180) * badge.radius}px)`,
                      ],
                    }
                  : undefined
              }
              transition={{
                opacity: { duration: 0.5, delay: 0.8 + i * 0.15 },
                scale: { duration: 0.5, delay: 0.8 + i * 0.15 },
                left: {
                  duration: badge.speed,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.8 + i * 0.15,
                },
                top: {
                  duration: badge.speed,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.8 + i * 0.15,
                },
              }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
              <span className={`text-[10px] font-medium ${badge.textColor} whitespace-nowrap`}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */

export const SecurityReviewHeroVisual = memo(SecurityReviewHeroVisualInner);
export default SecurityReviewHeroVisual;
