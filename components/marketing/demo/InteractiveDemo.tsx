'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, Monitor } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import DemoShell from './DemoShell';
import DashboardScreen from './screens/DashboardScreen';
import PoliciesScreen from './screens/PoliciesScreen';
import VaultScreen from './screens/VaultScreen';
import AuditScreen from './screens/AuditScreen';
import TasksScreen from './screens/TasksScreen';
import { demoScreenSequence } from './demo-data';
import type { DemoScreenId } from './demo-data';

// Screen labels for mobile tabs & progress
const screenLabels: Record<DemoScreenId, string> = {
  dashboard: 'Dashboard',
  policies: 'Policies',
  vault: 'Evidence Vault',
  audit: 'Audit Trail',
  tasks: 'Tasks',
};

const screenComponents: Record<DemoScreenId, React.ComponentType> = {
  dashboard: DashboardScreen,
  policies: PoliciesScreen,
  vault: VaultScreen,
  audit: AuditScreen,
  tasks: TasksScreen,
};

const AUTOPLAY_INTERVAL = 6000; // ms per screen
const RESUME_DELAY = 10000; // ms after interaction before resuming

export default function InteractiveDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [activeScreen, setActiveScreen] = useState<DemoScreenId>('dashboard');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const lastInteraction = useRef(0);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  // Auto-play logic
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsAutoPlaying(false);
      return;
    }

    if (!isAutoPlaying) return;

    startTimeRef.current = Date.now();
    progressRef.current = 0;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / AUTOPLAY_INTERVAL, 1);
      progressRef.current = pct;
      setProgress(pct);

      if (pct >= 1) {
        // Advance to next screen
        setActiveScreen((prev) => {
          const idx = demoScreenSequence.indexOf(prev);
          return demoScreenSequence[(idx + 1) % demoScreenSequence.length];
        });
        startTimeRef.current = Date.now();
        progressRef.current = 0;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoPlaying, activeScreen, prefersReducedMotion]);

  // Resume auto-play after idle
  useEffect(() => {
    if (isAutoPlaying || prefersReducedMotion) return;

    const timer = setInterval(() => {
      if (Date.now() - lastInteraction.current >= RESUME_DELAY) {
        setIsAutoPlaying(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, prefersReducedMotion]);

  const handleNavigate = useCallback((id: DemoScreenId) => {
    setActiveScreen(id);
    setIsAutoPlaying(false);
    lastInteraction.current = Date.now();
    setProgress(0);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((p) => !p);
    lastInteraction.current = Date.now();
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      lastInteraction.current = Date.now();
    }
  }, [isAutoPlaying]);

  const ActiveScreenComponent = screenComponents[activeScreen];

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-cyan-500/8 via-blue-500/6 to-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, ease: easing.signature }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 mb-5">
            <Monitor className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">Interactive Product Tour</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            See FormaOS in Action
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Explore the platform that makes compliance operational. Click through real screens or sit back and watch.
          </p>
        </motion.div>

        {/* Demo Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, ease: easing.signature, delay: 0.15 }}
          onMouseEnter={handleMouseEnter}
          className="relative"
        >
          {/* Glow border effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-purple-500/20 blur-sm" />

          <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
            {/* Browser chrome bar */}
            <div className="flex items-center justify-between bg-[#0d1225] border-b border-white/[0.06] px-4 py-2">
              <div className="flex items-center gap-4">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                {/* URL bar */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">
                  <span className="text-emerald-400">🔒</span>
                  <span>app.formaos.com.au</span>
                </div>
              </div>

              {/* Auto-play controls + Live badge */}
              <div className="flex items-center gap-3">
                {/* Live demo badge */}
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">
                    Live Demo
                  </span>
                </div>

                {/* Play/Pause */}
                <button
                  onClick={toggleAutoPlay}
                  className="flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isAutoPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                  <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>

            {/* Mobile tab bar (visible below md) */}
            <div className="flex md:hidden overflow-x-auto no-scrollbar border-b border-white/[0.06] bg-[#0d1225]/80">
              {demoScreenSequence.map((id) => (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`flex-shrink-0 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                    activeScreen === id
                      ? 'text-cyan-300 border-cyan-400'
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {screenLabels[id]}
                </button>
              ))}
            </div>

            {/* Demo shell */}
            <div className="h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px]">
              <DemoShell activeScreen={activeScreen} onNavigate={handleNavigate}>
                <ActiveScreenComponent />
              </DemoShell>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-white/[0.04]">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Screen indicators below frame */}
        <div className="flex justify-center gap-1.5 mt-6">
          {demoScreenSequence.map((id) => (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                activeScreen === id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {screenLabels[id]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
