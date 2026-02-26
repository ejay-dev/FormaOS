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
 * Massive 3D floating compliance core — the centerpiece of the product hero.
 *
 * Structure:
 *   - Outer glass shell with rotating border
 *   - 3 internal UI fragment layers (controls, evidence, audit)
 *   - Inner energy core with pulse
 *   - Ambient particle halo
 *
 * Scroll phases (driven by parent):
 *   Phase 1 (0–0.2): Object rotates, camera zooms, glow intensifies
 *   Phase 2 (0.2–0.5): Layers separate, UI panels emerge
 *   Phase 3 (0.5–0.8): Morphs into product interface
 */

interface ComplianceCoreObjectProps {
  scrollProgress: MotionValue<number>;
  className?: string;
}

function ComplianceCoreObjectInner({ scrollProgress, className = '' }: ComplianceCoreObjectProps) {
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();
  const driftRef = useRef(0);
  const rotateY = useSpring(0, { stiffness: 40, damping: 20 });
  const rotateX = useSpring(0, { stiffness: 40, damping: 20 });

  // ─── Scroll-driven transforms ───

  // Phase 1: zoom + rotate (0 → 0.2)
  const coreScale = useTransform(scrollProgress, [0, 0.15, 0.5, 0.8], [1, 1.15, 1.05, 0.3]);
  const coreOpacity = useTransform(scrollProgress, [0, 0.5, 0.75, 0.85], [1, 1, 0.8, 0]);
  const glowIntensity = useTransform(scrollProgress, [0, 0.15, 0.4], [0.3, 0.7, 0.4]);
  const scrollRotateY = useTransform(scrollProgress, [0, 0.5], [0, 45]);

  // Phase 2: layers separate (0.2 → 0.5)
  const layer1Y = useTransform(scrollProgress, [0.15, 0.4], [0, -80]);
  const layer2Y = useTransform(scrollProgress, [0.15, 0.4], [0, 0]);
  const layer3Y = useTransform(scrollProgress, [0.15, 0.4], [0, 80]);
  const layer1X = useTransform(scrollProgress, [0.2, 0.45], [0, -60]);
  const layer3X = useTransform(scrollProgress, [0.2, 0.45], [0, 60]);
  const layerSpread = useTransform(scrollProgress, [0.15, 0.45], [0, 1]);
  const layerOpacity = useTransform(scrollProgress, [0.1, 0.2, 0.7, 0.85], [0, 1, 1, 0]);

  // Phase 3: product UI emergence (0.5 → 0.8)
  const productScale = useTransform(scrollProgress, [0.45, 0.65, 0.85, 1], [0.7, 1, 1, 0.95]);
  const productOpacity = useTransform(scrollProgress, [0.45, 0.6, 0.85, 0.95], [0, 1, 1, 0]);
  const productY = useTransform(scrollProgress, [0.45, 0.65], [60, 0]);

  // Outer ring rotation
  const ringRotation = useTransform(scrollProgress, [0, 1], [0, 180]);

  // ─── Auto-drift / cursor motion ───
  useEffect(() => {
    if (prefersReduced) return;

    if (tierConfig.cursorTilt) {
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        rotateY.set(nx * 8);
        rotateX.set(-ny * 5);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    }

    // Mobile: slow auto-drift
    let raf: number;
    const drift = () => {
      driftRef.current += 0.005;
      rotateY.set(Math.sin(driftRef.current) * 6);
      rotateX.set(Math.cos(driftRef.current * 0.7) * 3);
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced, tierConfig.cursorTilt, rotateX, rotateY]);

  if (prefersReduced) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px]">
          <StaticCore />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ambient glow behind core */}
      <motion.div
        className="absolute w-[400px] h-[400px] sm:w-[550px] sm:h-[550px] lg:w-[700px] lg:h-[700px] rounded-full"
        style={{
          opacity: glowIntensity,
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
          filter: tierConfig.enableBlur ? 'blur(60px)' : 'blur(30px)',
        }}
      />

      {/* Secondary pulse glow */}
      <motion.div
        className="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 60%)',
          filter: tierConfig.enableBlur ? 'blur(40px)' : 'blur(20px)',
        }}
      />

      {/* ═══ MAIN 3D CORE ═══ */}
      <motion.div
        className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px]"
        style={{
          perspective: 1200,
          scale: coreScale,
          opacity: coreOpacity,
        }}
      >
        <motion.div
          style={{
            transformStyle: 'preserve-3d',
            rotateY: scrollRotateY,
          }}
        >
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
              rotateY,
              rotateX,
            }}
          >
            {/* ─── Outer rotating ring ─── */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                rotateZ: ringRotation,
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              {/* Ring accent marks */}
              {[0, 90, 180, 270].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-2 h-2 rounded-full bg-violet-400/40"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle}deg) translateY(-50%) translateX(-50%)`,
                    transformOrigin: '0 0',
                    marginTop: '-4px',
                    marginLeft: `${Math.cos((angle * Math.PI) / 180) * 50}%`,
                  }}
                />
              ))}
            </motion.div>

            {/* ─── Second ring (counter-rotate) ─── */}
            <motion.div
              className="absolute inset-[8%] rounded-full"
              style={{
                rotateZ: useTransform(ringRotation, (v) => -v * 0.6),
                border: '1px dashed rgba(6,182,212,0.15)',
              }}
            />

            {/* ─── Glass shell ─── */}
            <div className="absolute inset-[12%] rounded-[32px] sm:rounded-[40px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_0_80px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]"
              style={{ backdropFilter: tierConfig.enableBlur ? 'blur(12px)' : undefined }}
            >
              {/* Inner glass sheen */}
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>

            {/* ─── Internal UI fragments (Phase 2: they separate) ─── */}

            {/* Layer 1: Controls fragment — top-left */}
            <motion.div
              className="absolute rounded-2xl border border-white/[0.1] bg-gradient-to-br from-cyan-500/[0.08] to-transparent p-3 sm:p-4"
              style={{
                top: '18%',
                left: '15%',
                width: '42%',
                opacity: layerOpacity,
                y: layer1Y,
                x: layer1X,
                backdropFilter: tierConfig.enableBlur ? 'blur(8px)' : undefined,
                transformStyle: 'preserve-3d',
                translateZ: 20,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="text-[10px] sm:text-xs font-semibold text-white/70">Controls</span>
              </div>
              <div className="space-y-1.5">
                {['SOC 2', 'ISO 27001', 'GDPR'].map((fw) => (
                  <div key={fw} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] text-white/50">{fw}</span>
                    <span className="ml-auto text-[8px] sm:text-[9px] text-emerald-400/60">Pass</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Layer 2: Evidence fragment — center */}
            <motion.div
              className="absolute rounded-2xl border border-white/[0.1] bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-3 sm:p-4"
              style={{
                top: '38%',
                left: '30%',
                width: '40%',
                opacity: layerOpacity,
                y: layer2Y,
                backdropFilter: tierConfig.enableBlur ? 'blur(8px)' : undefined,
                transformStyle: 'preserve-3d',
                translateZ: 40,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-[10px] sm:text-xs font-semibold text-white/70">Evidence</span>
              </div>
              <div className="space-y-1.5">
                {['Access review', 'Policy sign-off', 'Backup logs'].map((ev, i) => (
                  <div key={ev} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      {i < 2 ? (
                        <><circle cx="6" cy="6" r="5" className="fill-emerald-500/20 stroke-emerald-500/50" strokeWidth="1" /><path d="M4 6.5L5.5 8L8 4.5" className="stroke-emerald-400" strokeWidth="1" strokeLinecap="round" /></>
                      ) : (
                        <circle cx="6" cy="6" r="5" className="stroke-white/20" strokeWidth="1" />
                      )}
                    </svg>
                    <span className="text-[9px] sm:text-[10px] text-white/50">{ev}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Layer 3: Audit fragment — bottom-right */}
            <motion.div
              className="absolute rounded-2xl border border-white/[0.1] bg-gradient-to-br from-violet-500/[0.08] to-transparent p-3 sm:p-4"
              style={{
                top: '52%',
                right: '12%',
                width: '42%',
                opacity: layerOpacity,
                y: layer3Y,
                x: layer3X,
                backdropFilter: tierConfig.enableBlur ? 'blur(8px)' : undefined,
                transformStyle: 'preserve-3d',
                translateZ: 10,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                <span className="text-[10px] sm:text-xs font-semibold text-white/70">Audit Score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3" className="stroke-white/[0.06]" />
                    <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-violet-400"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * 0.06}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.5))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs font-bold text-white/80">94%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] sm:text-[10px] text-white/40">142/148 controls</div>
                  <div className="text-[9px] sm:text-[10px] text-white/40">3 low findings</div>
                </div>
              </div>
            </motion.div>

            {/* ─── Energy core center ─── */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400/30 via-cyan-400/20 to-blue-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3),0_0_80px_rgba(6,182,212,0.15)]"
                style={{ backdropFilter: tierConfig.enableBlur ? 'blur(4px)' : undefined }}
              />
              {/* Inner bright core */}
              <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-white/20 to-white/5" />
            </motion.div>

            {/* ─── Orbital particles ─── */}
            {tierConfig.tier !== 'low' && (
              <>
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <motion.div
                    key={angle}
                    className="absolute top-1/2 left-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-300/60"
                    animate={{
                      x: [
                        Math.cos(((angle) * Math.PI) / 180) * 120,
                        Math.cos(((angle + 360) * Math.PI) / 180) * 120,
                      ],
                      y: [
                        Math.sin(((angle) * Math.PI) / 180) * 120,
                        Math.sin(((angle + 360) * Math.PI) / 180) * 120,
                      ],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      x: { duration: 12, repeat: Infinity, ease: 'linear' },
                      y: { duration: 12, repeat: Infinity, ease: 'linear' },
                      opacity: { duration: 3, repeat: Infinity, delay: i * 0.6 },
                    }}
                    style={{ marginLeft: '-3px', marginTop: '-3px' }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ═══ PHASE 3: PRODUCT UI EMERGENCE ═══ */}
      <motion.div
        className="absolute w-full max-w-[340px] sm:max-w-[480px] lg:max-w-[600px]"
        style={{
          scale: productScale,
          opacity: productOpacity,
          y: productY,
        }}
      >
        <div className="rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-[0_0_100px_rgba(139,92,246,0.12),0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden"
          style={{ backdropFilter: tierConfig.enableBlur ? 'blur(16px)' : undefined }}
        >
          {/* App header bar */}
          <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            </div>
            <div className="flex-1 mx-4 sm:mx-8">
              <div className="h-5 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-white/20 font-mono">app.formaos.com/dashboard</span>
              </div>
            </div>
          </div>

          {/* App sidebar + content */}
          <div className="flex h-[200px] sm:h-[280px] lg:h-[340px]">
            {/* Sidebar */}
            <div className="hidden sm:block w-[140px] lg:w-[160px] border-r border-white/[0.04] p-3 space-y-1.5">
              {['Dashboard', 'Controls', 'Evidence', 'Tasks', 'Reports', 'Settings'].map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${i === 0 ? 'bg-violet-500/15 text-violet-300' : 'text-white/30 hover:bg-white/[0.03]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-violet-400' : 'bg-white/15'}`} />
                  {item}
                </div>
              ))}
            </div>

            {/* Main content area */}
            <div className="flex-1 p-3 sm:p-4">
              {/* Page header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white/80">Compliance Dashboard</div>
                  <div className="text-[9px] sm:text-[10px] text-white/30 mt-0.5">All frameworks • Q1 2026</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400">94% Compliant</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                {[
                  { v: '142', l: 'Controls', c: 'text-cyan-400' },
                  { v: '98%', l: 'Evidence', c: 'text-emerald-400' },
                  { v: '3', l: 'Findings', c: 'text-amber-400' },
                ].map((s) => (
                  <div key={s.l} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className={`text-sm sm:text-base font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[8px] sm:text-[9px] text-white/25">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Framework rows */}
              <div className="space-y-1.5">
                {[
                  { fw: 'SOC 2 Type II', s: 'Pass', c: 'emerald' },
                  { fw: 'ISO 27001', s: 'Pass', c: 'emerald' },
                  { fw: 'GDPR', s: 'Review', c: 'amber' },
                  { fw: 'HIPAA', s: 'Pass', c: 'emerald' },
                ].map((r) => (
                  <div key={r.fw} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02]">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${r.c}-400`} />
                    <span className="text-[10px] sm:text-xs text-white/50 flex-1">{r.fw}</span>
                    <span className={`text-[9px] sm:text-[10px] font-semibold text-${r.c}-400/70`}>{r.s}</span>
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

/** Static fallback for reduced motion */
function StaticCore() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/5" style={{ filter: 'blur(40px)' }} />
      <div className="relative w-[70%] h-[70%] rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400/20 to-cyan-400/15 shadow-[0_0_30px_rgba(139,92,246,0.2)]" />
      </div>
    </div>
  );
}

export const ComplianceCoreObject = memo(ComplianceCoreObjectInner);
export default ComplianceCoreObject;
