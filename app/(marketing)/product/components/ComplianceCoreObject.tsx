'use client';

import { memo, useRef, useEffect } from 'react';
import {
  motion,
  useReducedMotion,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import { useDeviceTier } from '@/lib/device-tier';

/**
 * ComplianceCoreObject
 * ────────────────────
 * Massive 3D floating compliance core — centerpiece of product hero.
 *
 * Starts VISIBLE with glass shell + UI fragments inside.
 * On scroll: rotates → layers separate → morphs into full product UI.
 *
 * Scroll phases (driven by parent via scrollProgress 0–1):
 *   0–0.15: Core visible at 1x, slight zoom to 1.12x, glow intensifies
 *   0.15–0.45: UI fragments separate in 3D space
 *   0.45–0.7: Core dissolves, product interface scales up
 *   0.7–1.0: Product UI holds at full size
 */

interface ComplianceCoreObjectProps {
  scrollProgress: MotionValue<number>;
  className?: string;
}

function ComplianceCoreObjectInner({ scrollProgress, className = '' }: ComplianceCoreObjectProps) {
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();
  const driftRef = useRef(0);
  const interactRotateY = useSpring(0, { stiffness: 40, damping: 20 });
  const interactRotateX = useSpring(0, { stiffness: 40, damping: 20 });

  // ─── Scroll-driven transforms ───

  // Core: zoom in then shrink as product UI takes over
  const coreScale = useTransform(scrollProgress, [0, 0.12, 0.45, 0.65], [1, 1.12, 1.0, 0.2]);
  const coreOpacity = useTransform(scrollProgress, [0, 0.45, 0.6, 0.7], [1, 1, 0.4, 0]);
  const glowIntensity = useTransform(scrollProgress, [0, 0.12, 0.35, 0.5], [0.35, 0.7, 0.5, 0.2]);
  const scrollRotateY = useTransform(scrollProgress, [0, 0.45], [0, 40]);

  // UI fragments: VISIBLE from start, then separate on scroll
  const fragmentOpacity = useTransform(scrollProgress, [0, 0.55, 0.65], [1, 1, 0]);
  const layer1Y = useTransform(scrollProgress, [0.12, 0.4], [0, -90]);
  const layer1X = useTransform(scrollProgress, [0.15, 0.4], [0, -70]);
  const layer2Y = useTransform(scrollProgress, [0.12, 0.4], [0, 10]);
  const layer3Y = useTransform(scrollProgress, [0.12, 0.4], [0, 90]);
  const layer3X = useTransform(scrollProgress, [0.15, 0.4], [0, 70]);

  // Product UI: fades in as core dissolves, holds to end
  const productScale = useTransform(scrollProgress, [0.45, 0.65, 0.95, 1], [0.75, 1, 1, 0.97]);
  const productOpacity = useTransform(scrollProgress, [0.45, 0.6, 0.92, 1], [0, 1, 1, 0.6]);
  const productY = useTransform(scrollProgress, [0.45, 0.65], [50, 0]);

  // Rotating rings
  const ringRotation = useTransform(scrollProgress, [0, 1], [0, 180]);
  const counterRingRotation = useTransform(ringRotation, (v) => -v * 0.6);

  // ─── Cursor / auto-drift ───
  useEffect(() => {
    if (prefersReduced) return;

    if (tierConfig.cursorTilt) {
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        interactRotateY.set(nx * 8);
        interactRotateX.set(-ny * 5);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    }

    let raf: number;
    const drift = () => {
      driftRef.current += 0.005;
      interactRotateY.set(Math.sin(driftRef.current) * 6);
      interactRotateX.set(Math.cos(driftRef.current * 0.7) * 3);
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced, tierConfig.cursorTilt, interactRotateX, interactRotateY]);

  if (prefersReduced) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <StaticCore />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* ─── Ambient glow ─── */}
      <motion.div
        className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] lg:w-[650px] lg:h-[650px] rounded-full pointer-events-none"
        style={{
          opacity: glowIntensity,
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.1) 45%, transparent 70%)',
          filter: tierConfig.enableBlur ? 'blur(50px)' : 'blur(25px)',
        }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 60%)',
          filter: tierConfig.enableBlur ? 'blur(35px)' : 'blur(18px)',
        }}
      />

      {/* ═══ 3D CORE ═══ */}
      <motion.div
        className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[460px] lg:h-[460px]"
        style={{
          perspective: 1200,
          scale: coreScale,
          opacity: coreOpacity,
        }}
      >
        {/* Scroll rotation layer */}
        <motion.div style={{ transformStyle: 'preserve-3d', rotateY: scrollRotateY }}>
          {/* Interactive rotation layer */}
          <motion.div style={{ transformStyle: 'preserve-3d', rotateY: interactRotateY, rotateX: interactRotateX }}>

            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ rotateZ: ringRotation, border: '1px solid rgba(139,92,246,0.2)' }}
            >
              {[0, 90, 180, 270].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <div
                    key={angle}
                    className="absolute w-2 h-2 rounded-full bg-violet-400/50 shadow-[0_0_6px_rgba(139,92,246,0.4)]"
                    style={{
                      top: `${50 + Math.sin(rad) * 50}%`,
                      left: `${50 + Math.cos(rad) * 50}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </motion.div>

            {/* Inner ring (counter-rotate) */}
            <motion.div
              className="absolute inset-[8%] rounded-full pointer-events-none"
              style={{ rotateZ: counterRingRotation, border: '1px dashed rgba(6,182,212,0.15)' }}
            />

            {/* Glass shell */}
            <div
              className="absolute inset-[14%] rounded-[28px] sm:rounded-[36px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_0_60px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]"
              style={{ backdropFilter: tierConfig.enableBlur ? 'blur(10px)' : undefined }}
            >
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent" />
            </div>

            {/* ─── UI Fragment: Controls (top-left) ─── */}
            <motion.div
              className="absolute rounded-xl border border-white/[0.1] bg-gradient-to-br from-cyan-500/[0.08] to-transparent p-2.5 sm:p-3"
              style={{
                top: '20%', left: '16%', width: '40%',
                opacity: fragmentOpacity, y: layer1Y, x: layer1X,
                backdropFilter: tierConfig.enableBlur ? 'blur(6px)' : undefined,
                transformStyle: 'preserve-3d', translateZ: 20,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/70">Controls</span>
              </div>
              <div className="space-y-1">
                {['SOC 2', 'ISO 27001', 'GDPR'].map((fw) => (
                  <div key={fw} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/[0.03]">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[8px] sm:text-[9px] text-white/50">{fw}</span>
                    <span className="ml-auto text-[7px] sm:text-[8px] text-emerald-400/60">Pass</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── UI Fragment: Evidence (center) ─── */}
            <motion.div
              className="absolute rounded-xl border border-white/[0.1] bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-2.5 sm:p-3"
              style={{
                top: '40%', left: '32%', width: '38%',
                opacity: fragmentOpacity, y: layer2Y,
                backdropFilter: tierConfig.enableBlur ? 'blur(6px)' : undefined,
                transformStyle: 'preserve-3d', translateZ: 35,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/70">Evidence</span>
              </div>
              <div className="space-y-1">
                {['Access review', 'Policy sign-off', 'Backup logs'].map((ev, i) => (
                  <div key={ev} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/[0.03]">
                    <div className={`w-1 h-1 rounded-full ${i < 2 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span className="text-[8px] sm:text-[9px] text-white/50">{ev}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── UI Fragment: Audit (bottom-right) ─── */}
            <motion.div
              className="absolute rounded-xl border border-white/[0.1] bg-gradient-to-br from-violet-500/[0.08] to-transparent p-2.5 sm:p-3"
              style={{
                top: '55%', right: '14%', width: '40%',
                opacity: fragmentOpacity, y: layer3Y, x: layer3X,
                backdropFilter: tierConfig.enableBlur ? 'blur(6px)' : undefined,
                transformStyle: 'preserve-3d', translateZ: 10,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/70">Audit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                  <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3" className="stroke-white/[0.06]" />
                    <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-violet-400"
                      strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * 0.06}
                      style={{ filter: 'drop-shadow(0 0 3px rgba(139,92,246,0.4))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/80">94%</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[8px] sm:text-[9px] text-white/40">142/148 controls</div>
                  <div className="text-[8px] sm:text-[9px] text-white/40">3 low findings</div>
                </div>
              </div>
            </motion.div>

            {/* ─── Energy core ─── */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400/30 via-cyan-400/20 to-blue-500/30 shadow-[0_0_30px_rgba(139,92,246,0.25),0_0_60px_rgba(6,182,212,0.12)]" />
              <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-white/20 to-white/5" />
            </motion.div>

            {/* ─── Orbital particles ─── */}
            {tierConfig.tier !== 'low' && [0, 72, 144, 216, 288].map((angle, i) => (
              <motion.div
                key={angle}
                className="absolute top-1/2 left-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-300/50 pointer-events-none"
                animate={{
                  x: [Math.cos((angle * Math.PI) / 180) * 100, Math.cos(((angle + 360) * Math.PI) / 180) * 100],
                  y: [Math.sin((angle * Math.PI) / 180) * 100, Math.sin(((angle + 360) * Math.PI) / 180) * 100],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  x: { duration: 14, repeat: Infinity, ease: 'linear' },
                  y: { duration: 14, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 3, repeat: Infinity, delay: i * 0.6 },
                }}
                style={{ marginLeft: '-3px', marginTop: '-3px' }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ═══ PHASE 3: PRODUCT UI ═══ */}
      <motion.div
        className="absolute w-[92vw] max-w-[340px] sm:max-w-[520px] lg:max-w-[640px]"
        style={{ scale: productScale, opacity: productOpacity, y: productY }}
      >
        <div
          className="rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_0_80px_rgba(139,92,246,0.1),0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden"
          style={{ backdropFilter: tierConfig.enableBlur ? 'blur(14px)' : undefined }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
            </div>
            <div className="flex-1 mx-4 sm:mx-8">
              <div className="h-5 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-white/20 font-mono">app.formaos.com/dashboard</span>
              </div>
            </div>
          </div>

          {/* App layout */}
          <div className="flex h-[180px] sm:h-[260px] lg:h-[320px]">
            {/* Sidebar */}
            <div className="hidden sm:flex flex-col w-[130px] lg:w-[150px] border-r border-white/[0.04] p-2.5 gap-1">
              {['Dashboard', 'Controls', 'Evidence', 'Tasks', 'Reports', 'Settings'].map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${i === 0 ? 'bg-violet-500/15 text-violet-300' : 'text-white/30'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-violet-400' : 'bg-white/15'}`} />
                  {item}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white/80">Compliance Dashboard</div>
                  <div className="text-[9px] sm:text-[10px] text-white/30 mt-0.5">All frameworks &bull; Q1 2026</div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400">94%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                {[
                  { v: '142', l: 'Controls', c: 'text-cyan-400' },
                  { v: '98%', l: 'Evidence', c: 'text-emerald-400' },
                  { v: '3', l: 'Findings', c: 'text-amber-400' },
                ].map((s) => (
                  <div key={s.l} className="text-center p-1.5 sm:p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <div className={`text-xs sm:text-sm font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[7px] sm:text-[8px] text-white/25">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Framework rows */}
              <div className="space-y-1">
                {[
                  { fw: 'SOC 2 Type II', s: 'Pass', c: 'emerald' },
                  { fw: 'ISO 27001', s: 'Pass', c: 'emerald' },
                  { fw: 'GDPR', s: 'Review', c: 'amber' },
                  { fw: 'HIPAA', s: 'Pass', c: 'emerald' },
                ].map((r) => (
                  <div key={r.fw} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${r.c}-400`} />
                    <span className="text-[9px] sm:text-[10px] text-white/50 flex-1">{r.fw}</span>
                    <span className={`text-[8px] sm:text-[9px] font-semibold text-${r.c}-400/70`}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StaticCore() {
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/5" style={{ filter: 'blur(30px)' }} />
      <div className="relative w-[70%] h-[70%] rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400/20 to-cyan-400/15 shadow-[0_0_25px_rgba(139,92,246,0.2)]" />
      </div>
    </div>
  );
}

export const ComplianceCoreObject = memo(ComplianceCoreObjectInner);
export default ComplianceCoreObject;
