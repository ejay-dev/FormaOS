'use client';

/**
 * ProductHeroLargeObject — Full-bleed animated hero for /product
 *
 * Architecture:
 *   1. Full-viewport animation section (no headline text)
 *   2. Vertically-stacked glass panels forming a tower/column
 *   3. One panel ejects sideways, expands, and becomes a floating app window
 *   4. App window fills with realistic FormaOS dashboard UI
 *   5. Copy section (headline + CTAs) lives BELOW as a separate export
 *
 * Performance:
 *   - CSS 3D transforms only (no WebGL, no canvas) — GPU-composited
 *   - rAF-driven phase timer stops after sequence completes (~6s)
 *   - prefers-reduced-motion: skips to final state, no animation
 *   - Mobile: simplified static layout, no rAF
 *   - IntersectionObserver pauses when offscreen
 *   - No layout shift: animation container has fixed dimensions
 *
 * No new dependencies added — uses existing framer-motion + lucide-react.
 */

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

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

interface StackPanel {
  id: number;
  /** Y offset in the vertical stack (0 = center) */
  stackY: number;
  /** Slight X offset for organic feel */
  stackX: number;
  /** Z depth in stack */
  stackZ: number;
  /** Panel dimensions */
  width: number;
  height: number;
  /** Subtle rotation */
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  /** Gradient */
  gradient: string;
  borderColor: string;
  /** Stagger delay */
  delay: number;
}

/**
 * Panels are arranged in a VERTICAL STACK (like the TIDY reference).
 * Each panel is offset on the Y axis to form a column/tower.
 * The "hero" panel (id=5) sits mid-stack and will eject right.
 */
const STACK_PANELS: StackPanel[] = [
  // Top of stack
  {
    id: 0, stackY: -220, stackX: 4, stackZ: -8, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: -0.3, delay: 0,
    gradient: 'linear-gradient(135deg, rgba(160,131,255,0.10) 0%, rgba(51,153,255,0.06) 100%)',
    borderColor: 'rgba(160,131,255,0.10)',
  },
  {
    id: 1, stackY: -148, stackX: -2, stackZ: -5, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: -0.2, delay: 0.04,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.08) 0%, rgba(51,153,255,0.05) 100%)',
    borderColor: 'rgba(0,212,251,0.08)',
  },
  {
    id: 2, stackY: -76, stackX: 3, stackZ: -2, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: 0.1, delay: 0.08,
    gradient: 'linear-gradient(135deg, rgba(51,153,255,0.10) 0%, rgba(160,131,255,0.06) 100%)',
    borderColor: 'rgba(51,153,255,0.08)',
  },
  // Center row — two panels side by side (one will eject)
  {
    id: 3, stackY: -4, stackX: -6, stackZ: 0, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: 0, delay: 0.12,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.12) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(0,212,251,0.10)',
  },
  {
    id: 4, stackY: 68, stackX: 2, stackZ: 2, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: 0.2, delay: 0.16,
    gradient: 'linear-gradient(135deg, rgba(160,131,255,0.12) 0%, rgba(0,212,251,0.07) 100%)',
    borderColor: 'rgba(160,131,255,0.10)',
  },
  // THE HERO PANEL — this one ejects and transforms
  {
    id: 5, stackY: 140, stackX: 0, stackZ: 5, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: 0, delay: 0.20,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.18) 0%, rgba(51,153,255,0.12) 40%, rgba(160,131,255,0.14) 100%)',
    borderColor: 'rgba(0,212,251,0.18)',
  },
  // Bottom of stack
  {
    id: 6, stackY: 212, stackX: -3, stackZ: -2, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: -0.15, delay: 0.24,
    gradient: 'linear-gradient(135deg, rgba(51,153,255,0.09) 0%, rgba(160,131,255,0.06) 100%)',
    borderColor: 'rgba(51,153,255,0.07)',
  },
  {
    id: 7, stackY: 284, stackX: 5, stackZ: -6, width: 300, height: 62,
    rotateX: 2, rotateY: -8, rotateZ: 0.25, delay: 0.28,
    gradient: 'linear-gradient(135deg, rgba(0,212,251,0.07) 0%, rgba(51,153,255,0.04) 100%)',
    borderColor: 'rgba(0,212,251,0.06)',
  },
];

const HERO_PANEL_ID = 5;

/** Animation phase timing (seconds from mount) */
const T = {
  stackSettle:    0.6,   // panels fly in and settle
  pause:          1.4,   // brief hold on the full stack
  ejectStart:     1.8,   // hero panel begins ejecting right
  ejectEnd:       3.0,   // hero panel arrives at final position
  expandStart:    2.8,   // panel starts growing into app window
  expandEnd:      4.2,   // panel finished expanding
  uiStart:        3.8,   // dashboard UI begins fading in
  uiEnd:          5.4,   // dashboard UI fully visible
  done:           5.8,   // animation complete, stop rAF
} as const;

/* ═══════════════════════════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[60] opacity-[0.02] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANEL SKELETON CONTENT — each panel gets unique micro-UI
   ═══════════════════════════════════════════════════════════════════════ */

function PanelMicroContent({ id }: { id: number }) {
  const items: Record<number, React.ReactNode> = {
    0: (
      <div className="flex items-center gap-2 px-3 h-full">
        <div className="w-6 h-6 rounded-full bg-violet-400/15 shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="w-[65%] h-[3px] rounded bg-white/[0.07]" />
          <div className="w-[40%] h-[3px] rounded bg-white/[0.04]" />
        </div>
        <div className="px-2 py-0.5 rounded-full bg-violet-400/10 text-[6px] text-violet-400/50">Review</div>
      </div>
    ),
    1: (
      <div className="flex items-center gap-2 px-3 h-full">
        <div className="w-4 h-4 rounded border border-cyan-400/15 bg-cyan-400/5 shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="w-[70%] h-[3px] rounded bg-white/[0.07]" />
          <div className="w-[50%] h-[3px] rounded bg-white/[0.04]" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400/10" />
          <div className="w-3 h-3 rounded-full bg-blue-400/10" />
        </div>
      </div>
    ),
    2: (
      <div className="flex items-center gap-3 px-3 h-full">
        <div className="flex items-end gap-[2px] h-6">
          {[8, 14, 10, 18, 6, 12, 16].map((h, i) => (
            <div key={i} className="w-[4px] rounded-sm bg-blue-400/12" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[6px] text-white/15">Analytics</div>
          <div className="w-full h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
            <div className="w-[72%] h-full rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-400/15" />
          </div>
        </div>
      </div>
    ),
    3: (
      <div className="flex items-center gap-2 px-3 h-full">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400/15 to-blue-400/10 shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="w-[55%] h-[3px] rounded bg-white/[0.07]" />
          <div className="w-[35%] h-[3px] rounded bg-white/[0.04]" />
        </div>
        <div className="flex gap-1">
          <div className="px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-[5px] text-emerald-400/50">Done</div>
          <div className="px-1.5 py-0.5 rounded-full bg-cyan-400/10 text-[5px] text-cyan-400/50">3/4</div>
        </div>
      </div>
    ),
    4: (
      <div className="flex items-center gap-2 px-3 h-full">
        {[-1, 0, 1].map((offset) => (
          <div key={offset} className="w-5 h-5 rounded-full border border-white/[0.06]"
            style={{ marginLeft: offset === 0 ? '-6px' : offset === 1 ? '-6px' : '0',
              background: `linear-gradient(135deg, rgba(${offset === -1 ? '0,212,251' : offset === 0 ? '51,153,255' : '160,131,255'},0.15), transparent)` }} />
        ))}
        <div className="flex-1 space-y-1 ml-1">
          <div className="w-[60%] h-[3px] rounded bg-white/[0.06]" />
          <div className="w-[80%] h-[3px] rounded bg-white/[0.03]" />
        </div>
      </div>
    ),
    6: (
      <div className="flex items-center gap-2 px-3 h-full">
        <div className="w-6 h-6 rounded-lg bg-blue-400/10 shrink-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-blue-400/20" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="w-[50%] h-[3px] rounded bg-white/[0.07]" />
          <div className="w-[70%] h-[3px] rounded bg-white/[0.04]" />
        </div>
        <div className="text-[6px] text-white/15">94%</div>
      </div>
    ),
    7: (
      <div className="flex items-center gap-2 px-3 h-full">
        <div className="space-y-1">
          {[45, 60, 30].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-[4px] h-[4px] rounded-sm border border-white/[0.06]" />
              <div className="h-[2px] rounded bg-white/[0.04]" style={{ width: `${w}px` }} />
            </div>
          ))}
        </div>
      </div>
    ),
  };
  return <>{items[id] ?? null}</>;
}

/* ═══════════════════════════════════════════════════════════════════════
   REALISTIC APP WINDOW — the dashboard that appears in the ejected panel
   ═══════════════════════════════════════════════════════════════════════ */

const TASKS = [
  { title: 'Review SOC 2 Type II controls',  assignee: 'AK', status: 'In Progress', color: 'cyan',    pct: 72 },
  { title: 'Upload penetration test report',  assignee: 'SM', status: 'Pending',     color: 'amber',   pct: 0 },
  { title: 'Map ISO 27001 Annex A controls',  assignee: 'JR', status: 'Complete',    color: 'emerald',  pct: 100 },
  { title: 'Vendor risk assessment — Stripe',  assignee: 'LW', status: 'In Review',  color: 'blue',    pct: 88 },
  { title: 'Incident response plan update',   assignee: 'TP', status: 'In Progress', color: 'cyan',    pct: 45 },
  { title: 'Privacy impact assessment Q1',    assignee: 'ND', status: 'Pending',     color: 'amber',   pct: 0 },
];

const STATS = [
  { label: 'Controls',   value: '142', sub: '/ 156 mapped' },
  { label: 'Evidence',   value: '94%', sub: 'coverage' },
  { label: 'Audit Risk', value: 'Low', sub: '3 open items' },
];

const statusColors: Record<string, string> = {
  cyan: 'bg-cyan-400/60',
  amber: 'bg-amber-400/60',
  emerald: 'bg-emerald-400/60',
  blue: 'bg-blue-400/60',
};

const statusBadge: Record<string, string> = {
  Complete: 'bg-emerald-400/10 text-emerald-400/70',
  Pending: 'bg-amber-400/10 text-amber-400/70',
  'In Progress': 'bg-cyan-400/10 text-cyan-400/70',
  'In Review': 'bg-blue-400/10 text-blue-400/70',
};

function AppWindowUI({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: SIG_EASE }}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl"
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
              </div>
              <div className="text-[10px] text-white/25 font-mono tracking-wider ml-2">
                app.formaos.com.au / dashboard
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-20 h-6 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center px-2">
                <div className="text-[8px] text-white/15">Search…</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-500/15 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white/50">FO</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-[160px] shrink-0 border-r border-white/[0.05] bg-white/[0.012] py-4 px-3 flex flex-col">
              <div className="flex items-center gap-2 px-2 mb-5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/15 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-cyan-400/70">FO</span>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-white/50">FormaOS</div>
                  <div className="text-[7px] text-white/20">Enterprise</div>
                </div>
              </div>

              <div className="space-y-0.5">
                {[
                  { name: 'Dashboard', active: true, icon: '◫' },
                  { name: 'Tasks',     active: false, icon: '☐' },
                  { name: 'Evidence',  active: false, icon: '◉' },
                  { name: 'Controls',  active: false, icon: '⬡' },
                  { name: 'Policies',  active: false, icon: '▤' },
                  { name: 'Reports',   active: false, icon: '◈' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[9px] transition-colors ${
                      item.active
                        ? 'bg-cyan-400/[0.08] text-cyan-400/80 border border-cyan-400/10'
                        : 'text-white/25'
                    }`}
                  >
                    <span className="text-[11px] opacity-70">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-white/[0.05]">
                <div className="space-y-0.5">
                  {[
                    { name: 'Settings', icon: '⚙' },
                    { name: 'Help',     icon: '?' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[8px] text-white/20">
                      <span className="text-[10px] opacity-60">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-2.5 mt-3 pt-3 border-t border-white/[0.05]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400/25 to-blue-400/15" />
                  <div>
                    <div className="text-[8px] text-white/35">Nancy Martino</div>
                    <div className="text-[7px] text-white/15">Admin</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-5 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-[13px] font-semibold text-white/80 mb-0.5"
                  >
                    Dashboard
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-[8px] text-white/20"
                  >
                    Last synced 2 min ago · 6 tasks active
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <div className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[8px] text-white/30">
                    Export
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-cyan-400/10 border border-cyan-400/20 text-[8px] text-cyan-400/80">
                    + New Task
                  </div>
                </motion.div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.5, ease: SIG_EASE }}
                    className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3.5"
                  >
                    <div className="text-[7px] text-white/20 mb-1.5 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-[16px] font-bold text-white/80 mb-0.5">{stat.value}</div>
                    <div className="text-[7px] text-white/15">{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Task list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex items-center justify-between mb-3"
              >
                <span className="text-[9px] text-white/25 font-medium uppercase tracking-wider">Active Tasks</span>
                <span className="text-[8px] text-cyan-400/40">View All →</span>
              </motion.div>

              <div className="space-y-2">
                {TASKS.map((task, i) => (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: SIG_EASE }}
                    className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusColors[task.color]} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/45 truncate">{task.title}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 flex items-center justify-center shrink-0 border border-white/[0.04]">
                      <span className="text-[6px] font-semibold text-white/40">{task.assignee}</span>
                    </div>
                    <div className={`text-[7px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[task.status] ?? 'bg-white/5 text-white/30'}`}>
                      {task.status}
                    </div>
                    {task.pct > 0 && task.pct < 100 && (
                      <div className="w-14 h-1.5 rounded-full bg-white/[0.04] overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/25"
                          style={{ width: `${task.pct}%` }}
                        />
                      </div>
                    )}
                    {task.pct === 100 && (
                      <div className="text-[7px] text-emerald-400/40 shrink-0">✓</div>
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

/* ═══════════════════════════════════════════════════════════════════════
   3D VERTICAL PANEL STACK + EJECT ANIMATION
   ═══════════════════════════════════════════════════════════════════════ */

function VerticalPanelStack({
  phase,
  mouseX,
  mouseY,
  shouldAnimate,
  isDesktop,
}: {
  phase: number;
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
  isDesktop: boolean;
}) {
  const parallaxX = shouldAnimate && isDesktop ? mouseX * 6 : 0;
  const parallaxY = shouldAnimate && isDesktop ? mouseY * 4 : 0;

  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
  const ease4 = (t: number) => 1 - Math.pow(1 - t, 4);

  const progress = (start: number, end: number) =>
    shouldAnimate ? Math.min(1, Math.max(0, (phase - start) / (end - start))) : 1;

  const ejectProg  = ease4(progress(T.ejectStart, T.ejectEnd));
  const expandProg = ease3(progress(T.expandStart, T.expandEnd));
  const uiProg     = progress(T.uiStart, T.uiEnd);

  // Stack position — centered in the left portion of the viewport on desktop
  // On desktop the stack starts left-center, the ejected panel flies to the right
  const stackOffsetX = isDesktop ? -120 - ejectProg * 60 : 0;

  return (
    <div className="relative w-full h-full" style={{ perspective: '1800px' }}>
      {/* Deep ambient glows */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[30%] left-[25%] w-[40%] h-[50%] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }}
        />
        <div
          className="absolute top-[50%] left-[55%] w-[35%] h-[40%] rounded-full blur-[80px] opacity-15"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }}
        />
        <div
          className="absolute top-[20%] left-[45%] w-[25%] h-[30%] rounded-full blur-[60px] opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, rgba(51,153,255,0.3), transparent 70%)' }}
        />
      </div>

      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 0.5px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 3D scene */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateX(${stackOffsetX}px) rotateX(${12 + parallaxY}deg) rotateY(${-14 + parallaxX}deg)`,
          transition: shouldAnimate ? 'transform 0.12s linear' : 'none',
        }}
      >
        {STACK_PANELS.map((panel) => {
          const isHero = panel.id === HERO_PANEL_ID;

          let x = panel.stackX;
          let y = panel.stackY;
          let z = panel.stackZ;
          let rx = panel.rotateX;
          let ry = panel.rotateY;
          let rz = panel.rotateZ;
          let w = panel.width;
          let h = panel.height;
          let grad = panel.gradient;
          let border = panel.borderColor;

          if (isHero) {
            // Eject phase: slide right and forward
            const ejectX = isDesktop ? 380 : 200;
            x = x + ejectProg * ejectX;
            y = y + ejectProg * (-y * 0.8); // center vertically
            z = z + ejectProg * 80;
            // Flatten rotation as it ejects
            rx = rx * (1 - ejectProg * 0.9);
            ry = ry * (1 - ejectProg * 0.85) + ejectProg * 2;
            rz = rz * (1 - ejectProg);

            // Expand phase: grow into app window
            const targetW = isDesktop ? 560 : 380;
            const targetH = isDesktop ? 400 : 280;
            w = w + expandProg * (targetW - w);
            h = h + expandProg * (targetH - h);

            // Deepen background
            const bgBase = 0.18 + expandProg * 0.15;
            grad = `linear-gradient(145deg, rgba(0,212,251,${bgBase * 0.6}) 0%, rgba(10,15,28,${0.7 + expandProg * 0.25}) 25%, rgba(10,15,28,${0.8 + expandProg * 0.18}) 100%)`;
            border = `rgba(0,212,251,${0.18 + expandProg * 0.12})`;
          }

          // Entrance animation — panels slide in from below
          const entranceProg = shouldAnimate
            ? ease3(Math.min(1, Math.max(0, (phase - panel.delay) / 0.5)))
            : 1;
          const entranceY = (1 - entranceProg) * 120;
          const entranceOpacity = entranceProg;

          // Non-hero panels recede when hero ejects
          const fadeBack = !isHero ? ejectProg * 0.25 : 0;
          const pushBack = !isHero ? ejectProg * -20 : 0;

          // Subtle float for non-hero panels
          const breathe = shouldAnimate && !isHero && phase > T.stackSettle
            ? Math.sin((phase * 0.4 + panel.id * 1.1) * Math.PI) * 1.5
            : 0;

          const panelOpacity = entranceOpacity * (1 - fadeBack);

          return (
            <div
              key={panel.id}
              className="absolute overflow-hidden"
              style={{
                width: `${w}px`,
                height: `${h}px`,
                left: '50%',
                top: '50%',
                borderRadius: isHero && expandProg > 0.3 ? '16px' : '12px',
                transform: `translate(-50%, -50%) translate3d(${x}px, ${y + entranceY + breathe}px, ${z + pushBack}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
                background: grad,
                border: `1px solid ${border}`,
                boxShadow: isHero && ejectProg > 0.1
                  ? `0 0 ${30 + expandProg * 50}px rgba(0,212,251,${0.04 + expandProg * 0.08}), 0 ${15 + expandProg * 30}px ${30 + expandProg * 50}px rgba(0,0,0,${0.25 + expandProg * 0.2}), inset 0 1px 0 rgba(255,255,255,${0.03 + expandProg * 0.03})`
                  : `0 0 20px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)`,
                opacity: panelOpacity,
                backdropFilter: isHero && expandProg > 0.3 ? 'blur(24px) saturate(1.2)' : 'blur(6px)',
                willChange: 'transform, opacity',
                zIndex: isHero ? 30 : 10,
                transition: shouldAnimate ? 'none' : 'all 0s',
              }}
            >
              {/* Glass reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(168deg, rgba(255,255,255,${isHero ? 0.04 + expandProg * 0.02 : 0.04}) 0%, transparent ${isHero ? 35 + expandProg * 10 : 35}%)`,
                }}
              />

              {/* Micro-content for non-hero panels */}
              {!isHero && <PanelMicroContent id={panel.id} />}

              {/* App window for hero panel */}
              {isHero && <AppWindowUI visible={uiProg > 0.05} />}
            </div>
          );
        })}

        {/* Connection line from stack to ejected panel (desktop only) */}
        {isDesktop && ejectProg > 0.05 && ejectProg < 0.98 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: `${ejectProg * 300}px`,
              height: '1px',
              transform: `translate(${30}px, ${140 * (1 - ejectProg)}px) translateZ(${5 + ejectProg * 40}px)`,
              background: `linear-gradient(90deg, rgba(0,212,251,${0.15 * (1 - ejectProg)}) 0%, rgba(0,212,251,${0.08 * ejectProg}) 100%)`,
              opacity: Math.min(1, ejectProg * 4) * Math.max(0, 1 - (ejectProg - 0.7) * 3.3),
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE STATIC FALLBACK
   ═══════════════════════════════════════════════════════════════════════ */

function MobileHeroVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
      {/* Glows */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full blur-[80px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }}
        />
        <div
          className="absolute top-[50%] right-[15%] w-[40%] h-[40%] rounded-full blur-[60px] opacity-15"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }}
        />
      </div>

      {/* Stacked panels behind */}
      <div
        className="absolute"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(10deg) rotateY(-10deg)',
          left: '10%',
          top: '15%',
          width: '45%',
          height: '70%',
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-lg border border-white/[0.05]"
            style={{
              width: '100%',
              height: '48px',
              top: `${i * 56}px`,
              background: `linear-gradient(135deg, rgba(${
                i % 3 === 0 ? '0,212,251' : i % 3 === 1 ? '51,153,255' : '160,131,255'
              },${0.06 + i * 0.01}) 0%, rgba(10,15,28,0.3) 100%)`,
              transform: `translateZ(${-i * 3}px)`,
              opacity: 0.7 - i * 0.08,
            }}
          >
            <PanelMicroContent id={i} />
          </div>
        ))}
      </div>

      {/* Floating app window */}
      <div
        className="absolute rounded-2xl border border-cyan-400/15 overflow-hidden"
        style={{
          right: '5%',
          top: '12%',
          width: '65%',
          height: '76%',
          background: 'linear-gradient(145deg, rgba(0,212,251,0.08) 0%, rgba(10,15,28,0.85) 20%, rgba(10,15,28,0.92) 100%)',
          boxShadow: '0 0 60px rgba(0,212,251,0.06), 0 30px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          transform: 'rotateX(4deg) rotateY(-3deg)',
          transformStyle: 'preserve-3d',
          zIndex: 10,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, transparent 30%)' }}
        />
        <AppWindowUI visible />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL-BLEED ANIMATION SECTION (exported)
   The "hero" — takes the entire first viewport, no headline text.
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const shouldAnimate = !shouldReduceMotion;

  // Scroll-based fade
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.8, 0]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.98, 0.95]);

  // Desktop detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Intersection observer — pause when offscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Animation phase timer
  useEffect(() => {
    if (!shouldAnimate || !isDesktop) {
      setPhase(T.done + 1);
      return;
    }
    if (!isVisible) return; // pause when offscreen

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;

      if (elapsed <= T.done) {
        setPhase(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase(T.done + 1);
      }
    };

    // Defer start until after first paint
    const id = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 80);

    return () => {
      clearTimeout(id);
      cancelAnimationFrame(rafRef.current);
    };
  }, [shouldAnimate, isDesktop, isVisible]);

  // Pause when tab hidden
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Mouse parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop || shouldReduceMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    },
    [isDesktop, shouldReduceMotion],
  );

  const visual = useMemo(
    () =>
      isDesktop ? (
        <VerticalPanelStack
          phase={phase}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          shouldAnimate={shouldAnimate}
          isDesktop={isDesktop}
        />
      ) : (
        <MobileHeroVisual />
      ),
    [phase, mousePos.x, mousePos.y, shouldAnimate, isDesktop],
  );

  return (
    <motion.section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: isDesktop ? '92vh' : '75vh',
        minHeight: isDesktop ? '680px' : '500px',
        maxHeight: '1000px',
        opacity: sectionOpacity,
        scale: sectionScale,
      }}
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      <GrainOverlay />

      {/* Deep ambient background */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.25), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-5%] right-[-3%] w-[40%] h-[50%] rounded-full blur-[100px] opacity-[0.10]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.2), transparent 70%)' }}
        />
      </div>

      {/* The 3D visual */}
      <div className="absolute inset-0">
        {visual}
      </div>

      {/* Small "SCROLL" indicator at bottom */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={shouldAnimate ? { duration: 1, delay: 2 } : { duration: 0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <div className="text-[10px] tracking-[0.25em] text-white/15 uppercase">Scroll</div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="animate-bounce opacity-20">
          <path d="M7 2v10M3 8l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO COPY SECTION — rendered BELOW the animation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroCopy() {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  return (
    <section className="relative py-20 lg:py-28">
      {/* Subtle top glow connecting to animation above */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,251,0.15) 50%, transparent 100%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow } : { duration: 0 }}
          className="text-[11px] tracking-[0.3em] text-white/20 uppercase font-mono mb-6"
        >
          001 — Product
        </motion.div>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/[0.07] border border-cyan-500/20 mb-8 mx-auto"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium tracking-wide">
            Compliance Operating System
          </span>
        </motion.div>

        <motion.h1
          initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.15 } : { duration: 0 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-[1.05] tracking-tight text-white"
        >
          Your team&apos;s command center
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            for compliance.
          </span>
        </motion.h1>

        <motion.p
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.25 } : { duration: 0 }}
          className="text-lg sm:text-xl text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          Transform regulatory obligations into structured controls, owned
          actions, and audit-ready outcomes — in real time.
        </motion.p>

        <motion.p
          initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
          className="text-sm text-slate-500 mb-10 max-w-xl mx-auto"
        >
          Used by compliance teams. Aligned to ISO &amp; SOC frameworks.
          Built for audit defensibility.
        </motion.p>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.35 } : { duration: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <motion.a
            href={`${appBase}/auth/signup`}
            whileHover={
              shouldAnimate
                ? { scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' }
                : undefined
            }
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group px-10 py-4 text-base"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>

          <motion.a
            href="/contact"
            whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-secondary group px-10 py-4 text-base"
          >
            <span>Request Demo</span>
          </motion.a>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.45 } : { duration: 0 }}
          className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500"
        >
          {[
            { label: 'Structured Controls', color: 'bg-cyan-400' },
            { label: 'Owned Actions', color: 'bg-blue-400' },
            { label: 'Live Evidence', color: 'bg-violet-400' },
          ].map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
              {chip.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LEGACY COMPAT — keep default export for existing dynamic import
   ═══════════════════════════════════════════════════════════════════════ */

export { ProductHeroAnimation as ProductHero3D };
export default ProductHeroAnimation;
