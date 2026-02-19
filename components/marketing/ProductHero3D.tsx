'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const SIG_EASE = easing.signature as unknown as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface PanelConfig {
  id: number;
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  width: number;
  height: number;
  gradient: string;
  borderColor: string;
  delay: number;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS — palette + panel configs
   ═══════════════════════════════════════════════════════════ */

const PANELS: PanelConfig[] = [
  // Back layer — large ambient panels
  {
    id: 0, x: -30, y: -60, z: -120, rotateX: 8, rotateY: -6, rotateZ: -2,
    width: 280, height: 180, delay: 0,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.06) 0%, rgba(51,153,255,0.04) 100%)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  {
    id: 1, x: 60, y: -80, z: -90, rotateX: 6, rotateY: -4, rotateZ: 1,
    width: 240, height: 160, delay: 0.05,
    gradient: 'linear-gradient(135deg, rgba(160,131,255,0.06) 0%, rgba(51,153,255,0.04) 100%)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  // Mid layer — colorful accent panels
  {
    id: 2, x: -60, y: 20, z: -60, rotateX: 5, rotateY: -3, rotateZ: -1,
    width: 200, height: 140, delay: 0.1,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.12) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(0,212,251,0.12)',
  },
  {
    id: 3, x: 40, y: -20, z: -40, rotateX: 4, rotateY: -5, rotateZ: 0.5,
    width: 220, height: 150, delay: 0.15,
    gradient: 'linear-gradient(135deg, rgba(51,153,255,0.1) 0%, rgba(160,131,255,0.08) 100%)',
    borderColor: 'rgba(51,153,255,0.1)',
  },
  {
    id: 4, x: -20, y: 60, z: -20, rotateX: 3, rotateY: -2, rotateZ: -0.5,
    width: 190, height: 130, delay: 0.2,
    gradient: 'linear-gradient(135deg, rgba(160,131,255,0.12) 0%, rgba(0,212,251,0.06) 100%)',
    borderColor: 'rgba(160,131,255,0.1)',
  },
  // Front layer — most visible
  {
    id: 5, x: 70, y: 40, z: 0, rotateX: 2, rotateY: -4, rotateZ: 0,
    width: 210, height: 145, delay: 0.25,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.15) 0%, rgba(51,153,255,0.1) 50%, rgba(160,131,255,0.12) 100%)',
    borderColor: 'rgba(0,212,251,0.15)',
  },
  {
    id: 6, x: -40, y: -30, z: 10, rotateX: 2, rotateY: -3, rotateZ: 0.5,
    width: 180, height: 120, delay: 0.3,
    gradient: 'linear-gradient(135deg, rgba(51,153,255,0.14) 0%, rgba(160,131,255,0.1) 100%)',
    borderColor: 'rgba(51,153,255,0.12)',
  },
  // The "hero" panel — this one detaches and becomes the app window
  {
    id: 7, x: 20, y: 10, z: 30, rotateX: 1, rotateY: -2, rotateZ: 0,
    width: 260, height: 175, delay: 0.35,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.18) 0%, rgba(51,153,255,0.12) 40%, rgba(160,131,255,0.15) 100%)',
    borderColor: 'rgba(0,212,251,0.2)',
  },
];

const HERO_PANEL_ID = 7;

/* Animation phases: stack → detach → expand → reveal-ui */
const PHASE_TIMINGS = {
  stackSettle: 0.8,    // panels settle into 3D stack
  detachStart: 2.0,    // hero panel begins detaching
  detachEnd: 3.2,      // hero panel reaches forward position
  expandStart: 3.4,    // panel begins expanding
  expandEnd: 4.6,      // panel finishes expanding into app window
  uiRevealStart: 4.2,  // UI content begins appearing
  uiRevealEnd: 5.6,    // UI content fully visible
} as const;

/* ═══════════════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[60] opacity-[0.025] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   MINI UI CONTENT for skeleton panels
   ═══════════════════════════════════════════════════════════ */

function PanelSkeleton({ panel }: { panel: PanelConfig }) {
  // Different mini-content per panel to look like real cards
  const variants = [
    // Two-line text block
    <>
      <div className="w-[60%] h-[4px] rounded bg-white/[0.06] mb-[6px]" />
      <div className="w-[40%] h-[4px] rounded bg-white/[0.04]" />
    </>,
    // Avatar + text
    <>
      <div className="flex items-center gap-[6px] mb-[6px]">
        <div className="w-[14px] h-[14px] rounded-full bg-cyan-400/10" />
        <div className="w-[50%] h-[4px] rounded bg-white/[0.06]" />
      </div>
      <div className="w-[70%] h-[4px] rounded bg-white/[0.04]" />
    </>,
    // Stat block
    <>
      <div className="w-[30%] h-[4px] rounded bg-white/[0.04] mb-[6px]" />
      <div className="w-[60%] h-[8px] rounded bg-cyan-400/[0.08]" />
    </>,
    // Tags
    <>
      <div className="flex gap-[4px] mb-[6px]">
        <div className="w-[28px] h-[10px] rounded-full bg-cyan-400/[0.08]" />
        <div className="w-[24px] h-[10px] rounded-full bg-blue-400/[0.06]" />
      </div>
      <div className="w-[45%] h-[4px] rounded bg-white/[0.04]" />
    </>,
    // Chart bars
    <>
      <div className="flex items-end gap-[3px] h-[20px]">
        <div className="w-[6px] h-[8px] rounded-sm bg-cyan-400/10" />
        <div className="w-[6px] h-[14px] rounded-sm bg-blue-400/10" />
        <div className="w-[6px] h-[10px] rounded-sm bg-violet-400/10" />
        <div className="w-[6px] h-[18px] rounded-sm bg-cyan-400/10" />
        <div className="w-[6px] h-[6px] rounded-sm bg-blue-400/10" />
      </div>
    </>,
    // Progress bar
    <>
      <div className="w-[50%] h-[4px] rounded bg-white/[0.04] mb-[8px]" />
      <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
        <div className="w-[65%] h-full rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-400/15" />
      </div>
    </>,
    // Checkbox list
    <>
      {[40, 55, 35].map((w, i) => (
        <div key={i} className="flex items-center gap-[4px] mb-[3px]">
          <div className="w-[6px] h-[6px] rounded-sm border border-white/[0.08]" />
          <div className="h-[3px] rounded bg-white/[0.04]" style={{ width: `${w}%` }} />
        </div>
      ))}
    </>,
    // The hero panel gets special treatment — handled separately
    null,
  ];
  return (
    <div className="p-[10px] w-full h-full flex flex-col justify-center">
      {variants[panel.id % variants.length]}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REALISTIC APP WINDOW (fills the expanded hero panel)
   ═══════════════════════════════════════════════════════════ */

const DEMO_TASKS = [
  { title: 'Review SOC 2 Type II controls', assignee: 'AK', status: 'In Progress', statusColor: 'bg-cyan-400', pct: 72 },
  { title: 'Upload penetration test report', assignee: 'SM', status: 'Pending', statusColor: 'bg-amber-400', pct: 0 },
  { title: 'Map ISO 27001 Annex A controls', assignee: 'JR', status: 'Complete', statusColor: 'bg-emerald-400', pct: 100 },
  { title: 'Vendor risk assessment — Stripe', assignee: 'LW', status: 'In Review', statusColor: 'bg-blue-400', pct: 88 },
  { title: 'Incident response plan update', assignee: 'TP', status: 'In Progress', statusColor: 'bg-cyan-400', pct: 45 },
];

const DEMO_STATS = [
  { label: 'Controls', value: '142', sub: '/ 156 mapped' },
  { label: 'Evidence', value: '94%', sub: 'coverage' },
  { label: 'Audit Risk', value: 'Low', sub: '3 open items' },
];

function AppWindowUI({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: SIG_EASE }}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl"
        >
          {/* ── Window chrome ── */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
              </div>
              <div className="text-[10px] text-white/30 font-mono tracking-wide">
                app.formaos.com.au
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-5 rounded bg-white/[0.04] flex items-center justify-center">
                <div className="text-[8px] text-white/20">Search...</div>
              </div>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-400/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white/60">FO</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* ── Sidebar ── */}
            <div className="w-[140px] shrink-0 border-r border-white/[0.06] bg-white/[0.015] p-3 flex flex-col gap-1">
              {[
                { name: 'Dashboard', active: true, icon: '◫' },
                { name: 'Tasks', active: false, icon: '☐' },
                { name: 'Evidence', active: false, icon: '◉' },
                { name: 'Controls', active: false, icon: '⬡' },
                { name: 'Reports', active: false, icon: '▤' },
                { name: 'Settings', active: false, icon: '⚙' },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] ${
                    item.active
                      ? 'bg-cyan-400/10 text-cyan-400'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className="text-[10px]">{item.icon}</span>
                  {item.name}
                </div>
              ))}
              <div className="mt-auto pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400/30 to-blue-400/20" />
                  <div>
                    <div className="text-[8px] text-white/40">Enterprise</div>
                    <div className="text-[7px] text-white/20">Pro Plan</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-[11px] font-semibold text-white/80"
                  >
                    Dashboard
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-[8px] text-white/25"
                  >
                    Last updated 2 min ago
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="px-2 py-1 rounded bg-cyan-400/10 border border-cyan-400/20 text-[8px] text-cyan-400"
                >
                  + New Task
                </motion.div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {DEMO_STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: SIG_EASE }}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5"
                  >
                    <div className="text-[7px] text-white/25 mb-1">{stat.label}</div>
                    <div className="text-[13px] font-bold text-white/80">{stat.value}</div>
                    <div className="text-[7px] text-white/20">{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Task list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-[8px] text-white/25 mb-2 font-medium"
              >
                Active Tasks
              </motion.div>
              <div className="space-y-1.5">
                {DEMO_TASKS.map((task, i) => (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.08, duration: 0.4, ease: SIG_EASE }}
                    className="flex items-center gap-2 rounded-md bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${task.statusColor}/60 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] text-white/50 truncate">{task.title}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-600/40 to-slate-700/40 flex items-center justify-center shrink-0">
                      <span className="text-[6px] font-bold text-white/40">{task.assignee}</span>
                    </div>
                    <div className={`text-[7px] px-1.5 py-0.5 rounded-full ${
                      task.status === 'Complete' ? 'bg-emerald-400/10 text-emerald-400/60' :
                      task.status === 'Pending' ? 'bg-amber-400/10 text-amber-400/60' :
                      'bg-cyan-400/10 text-cyan-400/60'
                    }`}>
                      {task.status}
                    </div>
                    {task.pct > 0 && task.pct < 100 && (
                      <div className="w-12 h-1 rounded-full bg-white/[0.04] overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/25"
                          style={{ width: `${task.pct}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   3D PANEL STACK — the abstract structure
   ═══════════════════════════════════════════════════════════ */

function PanelStack({
  phase,
  mouseX,
  mouseY,
  shouldAnimate,
  isDesktop,
}: {
  phase: number; // time in seconds
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
  isDesktop: boolean;
}) {
  const parallaxX = shouldAnimate && isDesktop ? mouseX * 8 : 0;
  const parallaxY = shouldAnimate && isDesktop ? mouseY * 6 : 0;

  // Calculate hero panel animation state
  const detachProgress = shouldAnimate
    ? Math.min(1, Math.max(0, (phase - PHASE_TIMINGS.detachStart) / (PHASE_TIMINGS.detachEnd - PHASE_TIMINGS.detachStart)))
    : 1;
  const expandProgress = shouldAnimate
    ? Math.min(1, Math.max(0, (phase - PHASE_TIMINGS.expandStart) / (PHASE_TIMINGS.expandEnd - PHASE_TIMINGS.expandStart)))
    : 1;
  const uiProgress = shouldAnimate
    ? Math.min(1, Math.max(0, (phase - PHASE_TIMINGS.uiRevealStart) / (PHASE_TIMINGS.uiRevealEnd - PHASE_TIMINGS.uiRevealStart)))
    : 1;

  // Smooth easing for detach/expand
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const detachEased = easeOut(detachProgress);
  const expandEased = easeOut(expandProgress);

  return (
    <div className="relative w-full h-full" style={{ perspective: '1400px' }}>
      {/* Ambient glow behind the stack */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[50%] rounded-full blur-[80px] opacity-25"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.25) 0%, rgba(51,153,255,0.12) 40%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute top-[60%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[60px] opacity-15"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.2) 0%, transparent 70%)',
        }}
      />

      {/* The 3D scene container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${4 + parallaxY}deg) rotateY(${-6 + parallaxX}deg)`,
          transition: shouldAnimate ? 'transform 0.15s linear' : 'none',
        }}
      >
        {PANELS.map((panel) => {
          const isHero = panel.id === HERO_PANEL_ID;

          // Hero panel moves forward and expands
          let tx = panel.x;
          let ty = panel.y;
          let tz = panel.z;
          let rx = panel.rotateX;
          let ry = panel.rotateY;
          let rz = panel.rotateZ;
          let w = panel.width;
          let h = panel.height;
          let currentBorder = panel.borderColor;
          let currentGradient = panel.gradient;

          if (isHero) {
            // Phase 1: detach — slide forward in Z, center position
            tx = tx + detachEased * (0 - tx) * 0.7;
            ty = ty + detachEased * (-10 - ty) * 0.6;
            tz = tz + detachEased * 160;
            rx = rx * (1 - detachEased * 0.8);
            ry = ry * (1 - detachEased * 0.8);
            rz = rz * (1 - detachEased);

            // Phase 2: expand into app window
            w = w + expandEased * (420 - w);
            h = h + expandEased * (310 - h);
            tx = tx + expandEased * (-20 - tx) * 0.5;
            ty = ty + expandEased * (0 - ty) * 0.5;

            // Glass gets more opaque as it becomes the app window
            const bgOpacity = 0.18 + expandEased * 0.12;
            currentGradient = `linear-gradient(135deg, rgba(0,212,251,${bgOpacity}) 0%, rgba(10,15,30,${0.6 + expandEased * 0.3}) 30%, rgba(10,15,30,${0.7 + expandEased * 0.25}) 100%)`;
            currentBorder = `rgba(0,212,251,${0.2 + expandEased * 0.1})`;
          }

          // Non-hero panels fade back slightly when hero detaches
          const fadeBack = !isHero ? detachEased * 0.3 : 0;
          const panelOpacity = shouldAnimate
            ? Math.min(1, Math.max(0, (phase - panel.delay * 2) / 0.6)) * (1 - fadeBack)
            : 1;

          // Subtle breathing for non-hero panels
          const breathe = shouldAnimate && !isHero
            ? Math.sin((phase * 0.5 + panel.id * 0.8) * Math.PI) * 2
            : 0;

          return (
            <div
              key={panel.id}
              className="absolute rounded-xl overflow-hidden"
              style={{
                width: `${w}px`,
                height: `${h}px`,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate3d(${tx}px, ${ty + breathe}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
                background: currentGradient,
                border: `1px solid ${currentBorder}`,
                boxShadow: isHero && expandProgress > 0
                  ? `0 0 ${40 + expandEased * 60}px rgba(0,212,251,${0.05 + expandEased * 0.1}), 0 ${20 + expandEased * 40}px ${40 + expandEased * 60}px rgba(0,0,0,${0.3 + expandEased * 0.2})`
                  : `0 0 30px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.2)`,
                opacity: panelOpacity,
                backdropFilter: isHero && expandProgress > 0.5 ? 'blur(20px)' : 'blur(4px)',
                transition: shouldAnimate ? 'none' : 'all 0s',
                willChange: 'transform, opacity',
                zIndex: isHero ? 20 : 10 - Math.abs(panel.z),
              }}
            >
              {/* Reflection highlight on glass */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(170deg, rgba(255,255,255,0.06) 0%, transparent 40%)',
                }}
              />

              {/* Skeleton content for non-hero panels */}
              {!isHero && <PanelSkeleton panel={panel} />}

              {/* App window UI (only on hero panel when expanded) */}
              {isHero && <AppWindowUI visible={uiProgress > 0.1} />}
            </div>
          );
        })}
      </div>

      {/* Scattered ambient dots behind the stack */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 0.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOBILE STATIC FALLBACK
   ═══════════════════════════════════════════════════════════ */

function MobileStaticHero() {
  return (
    <div className="relative w-full max-w-[400px] mx-auto aspect-[4/3]" style={{ perspective: '1000px' }}>
      {/* Glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }}
      />
      {/* Static tilted app window */}
      <div
        className="absolute inset-4 rounded-xl border border-cyan-400/15 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,251,0.12) 0%, rgba(10,15,30,0.8) 30%, rgba(10,15,30,0.9) 100%)',
          transform: 'rotateX(6deg) rotateY(-4deg)',
          transformStyle: 'preserve-3d',
          boxShadow: '0 0 60px rgba(0,212,251,0.08), 0 30px 60px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, transparent 35%)' }} />
        <AppWindowUI visible />
      </div>
      {/* Stacked panels behind for depth */}
      {[-40, -25, -12].map((z, i) => (
        <div
          key={z}
          className="absolute rounded-lg border border-white/[0.04]"
          style={{
            width: `${85 - i * 8}%`,
            height: `${80 - i * 6}%`,
            left: `${7 + i * 4}%`,
            top: `${10 + i * 3}%`,
            background: `linear-gradient(135deg, rgba(${i === 0 ? '0,212,251' : i === 1 ? '51,153,255' : '160,131,255'},0.05) 0%, rgba(10,15,30,0.3) 100%)`,
            transform: `rotateX(6deg) rotateY(-4deg) translateZ(${z}px)`,
            transformStyle: 'preserve-3d',
            opacity: 0.4 - i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORTED COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function ProductHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -15%'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.34, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.97, 0.94]);
  const y = useTransform(scrollYProgress, [0, 0.82, 1], [0, 48, 110]);

  const shouldAnimate = !shouldReduceMotion;

  // Desktop detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Animation phase timer (runs the entrance sequence)
  useEffect(() => {
    if (!shouldAnimate || !isDesktop) {
      setPhase(PHASE_TIMINGS.uiRevealEnd + 1); // skip to end
      return;
    }

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      phaseRef.current = elapsed;

      // Only setState at key thresholds to avoid excessive re-renders
      // Use 60fps for the animation sequence, then stop
      if (elapsed <= PHASE_TIMINGS.uiRevealEnd + 0.5) {
        setPhase(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase(PHASE_TIMINGS.uiRevealEnd + 1);
      }
    };

    // Defer animation start until after paint
    const timeoutId = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [shouldAnimate, isDesktop]);

  // Mouse parallax (desktop only)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop || shouldReduceMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const yVal = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y: yVal });
    },
    [isDesktop, shouldReduceMotion],
  );

  // Memoize the 3D scene so it doesn't re-render on unrelated state changes
  const panelStack = useMemo(
    () =>
      isDesktop ? (
        <PanelStack
          phase={phase}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          shouldAnimate={shouldAnimate}
          isDesktop={isDesktop}
        />
      ) : (
        <MobileStaticHero />
      ),
    [phase, mousePos.x, mousePos.y, shouldAnimate, isDesktop],
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      <GrainOverlay />

      {/* Ambient background */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute top-[-15%] left-[-8%] w-[55%] h-[65%] rounded-full blur-[120px] opacity-[0.15]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-8%] right-[-5%] w-[45%] h-[55%] rounded-full blur-[100px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] rounded-full blur-[80px] opacity-[0.08]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(51,153,255,0.3), transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 xl:px-20 pt-32 pb-20 lg:pt-36 lg:pb-28">
        <motion.div style={{ opacity, scale, y }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-6 items-center">
            {/* ── Left column: copy ── */}
            <div className="flex flex-col items-start">
              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={shouldAnimate ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
                className="text-[11px] tracking-[0.3em] text-white/25 uppercase font-mono mb-6"
              >
                001 — Product
              </motion.div>

              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slow, delay: 0.2 } : { duration: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/[0.08] border border-cyan-500/20 mb-8"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium tracking-wide">
                  Compliance Operating System
                </span>
              </motion.div>

              <motion.h1
                initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.05] tracking-tight text-white"
              >
                Your team&apos;s
                <br />
                command center
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  for compliance.
                </span>
              </motion.h1>

              <motion.p
                initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
                className="text-base sm:text-lg text-slate-400 mb-8 max-w-md leading-relaxed"
              >
                Transform regulatory obligations into structured controls, owned
                actions, and audit-ready outcomes — in real time.
              </motion.p>

              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <motion.a
                  href={`${appBase}/auth/signup`}
                  whileHover={
                    shouldAnimate
                      ? { scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' }
                      : undefined
                  }
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-primary group px-8 py-4 text-base"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                <motion.a
                  href="/contact"
                  whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-secondary group px-8 py-4 text-base"
                >
                  <span>Request Demo</span>
                </motion.a>
              </motion.div>

              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={shouldAnimate ? { duration: duration.slower, delay: 1.2 } : { duration: 0 }}
                className="mt-14 flex items-center gap-2 text-[11px] tracking-[0.2em] text-white/20 uppercase"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Discover more
              </motion.div>
            </div>

            {/* ── Right column: 3D panel stack → app window ── */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={
                shouldAnimate
                  ? { duration: 1.0, delay: 0.2, ease: SIG_EASE }
                  : { duration: 0 }
              }
              className="relative w-full aspect-[4/3] max-w-[680px] mx-auto lg:mx-0 lg:ml-auto"
            >
              {panelStack}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProductHero3D;
