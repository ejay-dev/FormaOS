'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Play, Pause, Building2, Zap, Eye, Shield, ArrowRight,
  RotateCcw, MousePointer, MonitorPlay, HelpCircle,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { PHASE_SEQUENCE, PHASE_CONFIGS, type PhaseId } from './phase-demo-data';
import { StructureScreen, OperationalizeScreen, ValidateScreen, DefendScreen } from './phase-screens';
import { GuidedTourOverlay, TOUR_STEPS } from './GuidedTour';
import {
  trackDemoEvent, startPhaseTimer, endPhaseTimer,
  startDemoSession, getDemoSessionDuration,
} from './demo-analytics';

// Lazy-load sandbox mode — only loaded after user clicks the toggle
const SandboxScreen = lazy(() => import('./SandboxScreen'));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DemoMode = 'simulation' | 'sandbox';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTOPLAY_INTERVAL = 8000;
const RESUME_DELAY = 12000;

const phaseIcons: Record<PhaseId, ComponentType<{ className?: string }>> = {
  structure: Building2,
  operationalize: Zap,
  validate: Eye,
  defend: Shield,
};

const phaseScreens: Record<PhaseId, ComponentType> = {
  structure: StructureScreen,
  operationalize: OperationalizeScreen,
  validate: ValidateScreen,
  defend: DefendScreen,
};

const screenTransition = {
  duration: duration.normal,
  ease: easing.signature,
};

const phaseActiveColors: Record<string, { tab: string; border: string; glow: string }> = {
  cyan: {
    tab: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    border: 'border-cyan-500/25',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.12)]',
  },
  blue: {
    tab: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    border: 'border-blue-500/25',
    glow: 'shadow-[0_0_60px_rgba(59,130,246,0.12)]',
  },
  purple: {
    tab: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/25',
    glow: 'shadow-[0_0_60px_rgba(139,92,246,0.12)]',
  },
  pink: {
    tab: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    border: 'border-pink-500/25',
    glow: 'shadow-[0_0_60px_rgba(236,72,153,0.12)]',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhaseDemo() {
  const prefersReducedMotion = useReducedMotion();

  // Core state
  const [activePhase, setActivePhase] = useState<PhaseId>('structure');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

  // Dual-mode state
  const [demoMode, setDemoMode] = useState<DemoMode>('simulation');
  const [sandboxLoaded, setSandboxLoaded] = useState(false);
  const [sandboxKey, setSandboxKey] = useState(0); // increment to force reset

  // Guided tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Refs
  const lastInteraction = useRef(0);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const sectionRef = useRef<HTMLElement>(null);
  const isInViewport = useRef(false);
  const userPaused = useRef(false);
  const sessionStarted = useRef(false);

  // -------------------------------------------------------------------------
  // Session tracking
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!sessionStarted.current) {
      startDemoSession();
      sessionStarted.current = true;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Viewport observer
  // -------------------------------------------------------------------------

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewport.current = entry.isIntersecting;
        if (demoMode !== 'simulation') return;
        if (entry.isIntersecting) {
          if (!userPaused.current) {
            setIsAutoPlaying(true);
          }
        } else {
          setIsAutoPlaying(false);
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, demoMode]);

  // -------------------------------------------------------------------------
  // Auto-play engine (simulation mode only)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (prefersReducedMotion || demoMode !== 'simulation') {
      if (demoMode !== 'simulation') setIsAutoPlaying(false);
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
        setActivePhase((prev) => {
          endPhaseTimer(prev, 'simulation');
          const idx = PHASE_SEQUENCE.indexOf(prev);
          const nextIdx = (idx + 1) % PHASE_SEQUENCE.length;
          if (nextIdx === 0) {
            setHasCompletedOnce(true);
            trackDemoEvent({
              type: 'demo_cycle_completed',
              totalDurationMs: getDemoSessionDuration(),
              mode: 'simulation',
            });
          }
          const nextPhase = PHASE_SEQUENCE[nextIdx];
          startPhaseTimer(nextPhase);
          trackDemoEvent({ type: 'demo_phase_viewed', phase: nextPhase, mode: 'simulation' });
          return nextPhase;
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
  }, [isAutoPlaying, activePhase, prefersReducedMotion, demoMode]);

  // -------------------------------------------------------------------------
  // Resume auto-play after idle (simulation mode only)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isAutoPlaying || prefersReducedMotion || demoMode !== 'simulation') return;

    const timer = setInterval(() => {
      if (
        !userPaused.current &&
        isInViewport.current &&
        !tourActive &&
        Date.now() - lastInteraction.current >= RESUME_DELAY
      ) {
        setIsAutoPlaying(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, prefersReducedMotion, demoMode, tourActive]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleNavigate = useCallback((id: PhaseId) => {
    endPhaseTimer(activePhase, demoMode);
    setActivePhase(id);
    startPhaseTimer(id);
    trackDemoEvent({ type: 'demo_phase_viewed', phase: id, mode: demoMode });
    if (demoMode === 'simulation') {
      setIsAutoPlaying(false);
      userPaused.current = false;
    }
    lastInteraction.current = Date.now();
    setProgress(0);
  }, [activePhase, demoMode]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((p) => {
      const next = !p;
      userPaused.current = !next;
      return next;
    });
    lastInteraction.current = Date.now();
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isAutoPlaying && demoMode === 'simulation') {
      setIsAutoPlaying(false);
      userPaused.current = false;
      lastInteraction.current = Date.now();
    }
  }, [isAutoPlaying, demoMode]);

  const handleModeSwitch = useCallback((mode: DemoMode) => {
    const prevMode = demoMode;
    trackDemoEvent({ type: 'demo_mode_switched', from: prevMode, to: mode });
    setDemoMode(mode);

    if (mode === 'sandbox') {
      setSandboxLoaded(true);
      setIsAutoPlaying(false);
      userPaused.current = true;
    } else {
      userPaused.current = false;
      if (isInViewport.current) {
        setIsAutoPlaying(true);
      }
    }
  }, [demoMode]);

  const handleReset = useCallback(() => {
    trackDemoEvent({ type: 'demo_reset' });
    setActivePhase('structure');
    setProgress(0);
    setHasCompletedOnce(false);
    setSandboxKey((k) => k + 1);
    if (demoMode === 'simulation') {
      setIsAutoPlaying(true);
      userPaused.current = false;
      startTimeRef.current = Date.now();
    }
    startPhaseTimer('structure');
  }, [demoMode]);

  const handleStartTour = useCallback(() => {
    trackDemoEvent({ type: 'demo_tour_started' });
    setTourActive(true);
    setTourStep(0);
    setIsAutoPlaying(false);
    userPaused.current = true;
  }, []);

  const handleTourNext = useCallback(() => {
    setTourStep((s) => {
      const next = Math.min(s + 1, TOUR_STEPS.length - 1);
      setActivePhase(TOUR_STEPS[next].phase);
      return next;
    });
  }, []);

  const handleTourPrev = useCallback(() => {
    setTourStep((s) => {
      const prev = Math.max(s - 1, 0);
      setActivePhase(TOUR_STEPS[prev].phase);
      return prev;
    });
  }, []);

  const handleTourDismiss = useCallback(() => {
    setTourActive(false);
    userPaused.current = false;
    if (demoMode === 'simulation' && isInViewport.current) {
      setIsAutoPlaying(true);
    }
  }, [demoMode]);

  const handleTourGoToPhase = useCallback((phase: PhaseId) => {
    setActivePhase(phase);
    startPhaseTimer(phase);
  }, []);

  const handleCtaClick = useCallback(() => {
    trackDemoEvent({
      type: 'demo_cta_clicked',
      source: 'phase_demo',
      phase: activePhase,
    });
  }, [activePhase]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const activeConfig = PHASE_CONFIGS[activePhase];
  const activeIdx = PHASE_SEQUENCE.indexOf(activePhase);
  const activeColors = phaseActiveColors[activeConfig.color];
  const ActiveSimScreen = phaseScreens[activePhase];
  const isSimulation = demoMode === 'simulation';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <section ref={sectionRef} className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-3xl"
          animate={{
            background: `radial-gradient(ellipse, ${activeConfig.glowColor} 0%, transparent 70%)`,
          }}
          transition={{ duration: 1.0 }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, ease: easing.signature }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-300">The FormaOS Operating Model</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 tracking-tight">
            Four Phases.
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}Complete Control.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            {isSimulation
              ? 'Watch each phase execute in real time. Click any step to explore, or sit back and watch the full cycle.'
              : 'Explore the platform yourself. Click tasks, open evidence, fire workflow triggers, and see real compliance workflows.'}
          </p>
        </motion.div>

        {/* Mode Toggle + Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          {/* Dual-mode toggle */}
          <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => handleModeSwitch('simulation')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all ${
                isSimulation
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              Simulation
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('sandbox')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all ${
                !isSimulation
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
              Interactive Sandbox
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartTour}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guided Tour</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Phase Tab Selector (desktop, simulation mode only) */}
        {isSimulation && (
          <div className="hidden md:flex justify-center gap-2 mb-8">
            {PHASE_SEQUENCE.map((id) => {
              const config = PHASE_CONFIGS[id];
              const Icon = phaseIcons[id];
              const isActive = activePhase === id;
              const isPast = PHASE_SEQUENCE.indexOf(id) < activeIdx;
              const colors = phaseActiveColors[config.color];

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavigate(id)}
                  className={`relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border ${
                    isActive
                      ? colors.tab
                      : isPast
                        ? 'bg-white/[0.03] text-slate-400 border-white/[0.08]'
                        : 'bg-white/[0.02] text-slate-500 border-transparent hover:bg-white/[0.04] hover:text-slate-300'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                    isActive ? `bg-gradient-to-br ${config.accent}` : 'bg-white/[0.06]'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider opacity-60">Phase {config.number}</div>
                    <div className="text-xs font-semibold">{config.verb}</div>
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-gradient-to-r"
                      style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                      layoutId="phaseTabIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Demo Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, ease: easing.signature, delay: 0.15 }}
          onMouseEnter={handleMouseEnter}
          className="relative"
        >
          {/* Glow border */}
          <motion.div
            className="absolute -inset-px rounded-2xl blur-sm"
            animate={{
              background: `linear-gradient(to bottom, ${activeConfig.glowColor}, transparent 50%, ${activeConfig.glowColor})`,
            }}
            transition={{ duration: 0.8 }}
          />

          <div className={`relative rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.4)] transition-all duration-500 ${activeColors.glow}`}>
            {/* Browser chrome */}
            <div className="flex items-center justify-between bg-[#0d1225] border-b border-white/[0.06] px-4 py-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">
                  <span className="text-emerald-400">🔒</span>
                  <span>app.formaos.com.au</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${isSimulation ? 'bg-amber-400/60' : 'bg-emerald-400/60'}`} />
                  <span className="text-[9px] text-slate-500">
                    {isSimulation ? 'Simulated Demo' : 'Interactive Sandbox'}
                  </span>
                </div>
                {isSimulation && (
                  <button
                    type="button"
                    onClick={toggleAutoPlay}
                    aria-label={isAutoPlaying ? 'Pause demo' : 'Play demo'}
                    className="flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isAutoPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                    <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile tab bar (simulation mode) */}
            {isSimulation && (
              <div
                className="flex md:hidden overflow-x-auto no-scrollbar border-b border-white/[0.06] bg-[#0d1225]/80"
                role="tablist"
                aria-label="Phase demo navigation"
              >
                {PHASE_SEQUENCE.map((id) => {
                  const config = PHASE_CONFIGS[id];
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => handleNavigate(id)}
                      role="tab"
                      aria-selected={activePhase === id}
                      className={`flex-shrink-0 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                        activePhase === id
                          ? 'text-cyan-300 border-cyan-400'
                          : 'text-slate-500 border-transparent hover:text-slate-300'
                      }`}
                    >
                      {config.verb}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main content area */}
            <div className="flex h-[400px] sm:h-[460px] md:h-[500px] lg:h-[540px]">
              {/* Phase sidebar (desktop, simulation mode) */}
              {isSimulation && (
                <div className="hidden md:flex md:w-[180px] lg:w-[200px] flex-shrink-0 flex-col bg-[#080c18] border-r border-white/[0.05] p-3">
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-3 px-2">
                    Operating Model
                  </div>
                  <div className="space-y-1">
                    {PHASE_SEQUENCE.map((id, i) => {
                      const config = PHASE_CONFIGS[id];
                      const Icon = phaseIcons[id];
                      const isActive = activePhase === id;
                      const isPast = i < activeIdx;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleNavigate(id)}
                          className={`relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                            isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-lg bg-white/[0.06]"
                              layoutId="phaseSidebarActive"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <div className={`relative z-10 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? `bg-gradient-to-br ${config.accent}`
                              : isPast ? 'bg-emerald-500/15' : 'bg-white/[0.04]'
                          }`}>
                            <Icon className={`h-3.5 w-3.5 ${
                              isActive ? 'text-white' : isPast ? 'text-emerald-400' : 'text-slate-500'
                            }`} />
                          </div>
                          <div className="relative z-10 min-w-0">
                            <div className={`text-[9px] uppercase tracking-wider ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                              Phase {config.number}
                            </div>
                            <div className={`text-[11px] font-medium truncate ${
                              isActive ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              {config.verb}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-3 border-t border-white/[0.05]">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activePhase}
                        className="text-[10px] text-slate-500 leading-relaxed px-2"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeConfig.subtitle}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Screen content */}
              <div className="relative flex-1 overflow-hidden bg-[#0b1022]">
                {isSimulation ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePhase}
                      initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                      transition={screenTransition}
                      className="absolute inset-0 overflow-y-auto overflow-x-hidden p-3 md:p-4"
                    >
                      <ActiveSimScreen />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  sandboxLoaded && (
                    <Suspense fallback={
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                          <span className="text-[11px] text-slate-500">Loading sandbox...</span>
                        </div>
                      </div>
                    }>
                      <SandboxScreen key={sandboxKey} activePhase={activePhase} />
                    </Suspense>
                  )
                )}

                {/* Guided Tour Overlay (inside the demo viewport) */}
                <GuidedTourOverlay
                  isActive={tourActive}
                  currentStep={tourStep}
                  onNext={handleTourNext}
                  onPrev={handleTourPrev}
                  onDismiss={handleTourDismiss}
                  onGoToPhase={handleTourGoToPhase}
                />
              </div>
            </div>

            {/* 4-segment progress bar (simulation mode only) */}
            {isSimulation && (
              <div className="flex h-1 bg-white/[0.04]">
                {PHASE_SEQUENCE.map((id, i) => {
                  let fillPct = 0;
                  if (i < activeIdx) fillPct = 100;
                  else if (i === activeIdx) fillPct = progress * 100;
                  return (
                    <div
                      key={id}
                      className="flex-1 relative overflow-hidden"
                      style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${PHASE_CONFIGS[id].accent}`}
                        style={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sandbox mode bottom bar */}
            {!isSimulation && (
              <div className="flex items-center justify-between bg-[#0d1225] border-t border-white/[0.06] px-4 py-1.5">
                <div className="flex items-center gap-1.5">
                  <MousePointer className="h-3 w-3 text-cyan-400" />
                  <span className="text-[9px] text-slate-500">Click any item to explore — open tasks, evidence, and audit trails</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400/80">Interactive</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Phase indicators below frame */}
        <div className="flex justify-center gap-1.5 mt-6">
          {PHASE_SEQUENCE.map((id) => {
            const config = PHASE_CONFIGS[id];
            return (
              <button
                type="button"
                key={id}
                onClick={() => handleNavigate(id)}
                aria-label={`Go to Phase ${config.number}: ${config.verb}`}
                className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                  activePhase === id
                    ? phaseActiveColors[config.color].tab
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <span className="text-[10px] opacity-60">{config.number}</span>
                {config.verb}
              </button>
            );
          })}
        </div>

        {/* Simulated demo note */}
        <p className="text-center text-[11px] text-slate-600 mt-3">
          {isSimulation
            ? 'Simulated demo with sample data — no real systems connected'
            : 'Interactive sandbox with pre-seeded demo data — fully client-side, no API calls'}
        </p>

        {/* CTA after first complete loop */}
        <AnimatePresence>
          {hasCompletedOnce && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: duration.slow, ease: easing.signature }}
            >
              <a
                href="/signup?source=phase_demo"
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all"
              >
                Try the Live Trial
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
