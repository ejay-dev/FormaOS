'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import {
  Layers,
  ListChecks,
  BarChart3,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

/* ------------------------------------------------------------------
 * Tour step definitions
 * ----------------------------------------------------------------*/

interface TourStep {
  id: number;
  label: string;
  title: string;
  description: string;
  screenshot: string;
  icon: typeof Layers;
  accent: string; // tailwind gradient
  glowColor: string; // raw rgba for box-shadow
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    label: 'Model',
    title: 'Model Your Compliance',
    description:
      'Select from pre-built frameworks like ISO 27001, NDIS Practice Standards, or Essential Eight -- or define your own. FormaOS maps every obligation to controls, owners, and evidence requirements automatically.',
    screenshot: '/marketing/screenshots/compliance.png',
    icon: Layers,
    accent: 'from-cyan-500 to-blue-500',
    glowColor: 'rgba(6, 182, 212, 0.35)',
  },
  {
    id: 2,
    label: 'Execute',
    title: 'Execute With Precision',
    description:
      'Turn obligations into actionable tasks with clear ownership, deadlines, and workflow automation. Every task links back to its governing control so nothing falls through the cracks.',
    screenshot: '/marketing/screenshots/tasks.png',
    icon: ListChecks,
    accent: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.35)',
  },
  {
    id: 3,
    label: 'Verify',
    title: 'Verify In Real-Time',
    description:
      'Watch your compliance posture update live. Dashboards surface control health, gap analysis, and risk scores across every framework and business unit in one view.',
    screenshot: '/marketing/screenshots/dashboard.png',
    icon: BarChart3,
    accent: 'from-indigo-500 to-purple-500',
    glowColor: 'rgba(139, 92, 246, 0.35)',
  },
  {
    id: 4,
    label: 'Prove',
    title: 'Prove To Auditors',
    description:
      'Generate structured evidence bundles, audit-ready reports, and exportable compliance packages on demand. Everything is timestamped, version-controlled, and linked to its source control.',
    screenshot: '/marketing/screenshots/reports.png',
    icon: FileCheck2,
    accent: 'from-purple-500 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.35)',
  },
];

const AUTO_ADVANCE_MS = 6000;

/* ------------------------------------------------------------------
 * Animation variants
 * ----------------------------------------------------------------*/

const signatureEase: [number, number, number, number] = [...easing.signature];
const exitEase: [number, number, number, number] = [...easing.exit];

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: signatureEase },
  },
};

const screenshotVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 80 : -80,
    scale: 0.95,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: duration.slow,
      ease: signatureEase,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
    scale: 0.95,
    transition: {
      duration: duration.normal,
      ease: exitEase,
    },
  }),
};

const textVariants = {
  enter: { opacity: 0, y: 16 },
  center: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: signatureEase,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: duration.fast,
      ease: exitEase,
    },
  },
};

/* ------------------------------------------------------------------
 * Component
 * ----------------------------------------------------------------*/

export function InteractiveProductTour() {
  const prefersReduced = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = TOUR_STEPS[activeStep];

  /* --- Navigation helpers --- */

  const goToStep = useCallback(
    (index: number) => {
      setDirection(index > activeStep ? 1 : -1);
      setActiveStep(index);
    },
    [activeStep],
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveStep((prev) => (prev + 1) % TOUR_STEPS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveStep(
      (prev) => (prev - 1 + TOUR_STEPS.length) % TOUR_STEPS.length,
    );
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  /* --- Auto-advance timer --- */

  useEffect(() => {
    if (isPaused || isHovered) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      goNext();
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isHovered, goNext]);

  /* --- Keyboard navigation --- */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, togglePause]);

  /* --- Reduced motion overrides --- */

  const effectiveScreenshotVariants = prefersReduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : screenshotVariants;

  const effectiveTextVariants = prefersReduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : textVariants;

  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Interactive Product Tour
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Four Steps to{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Continuous Compliance
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400">
            See how FormaOS takes you from framework selection to audit-ready
            proof -- automatically and in real time.
          </p>
        </motion.div>

        {/* ---- Step selector (top numbered tabs) ---- */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10">
          {TOUR_STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === activeStep;
            return (
              <button
                key={s.id}
                onClick={() => goToStep(idx)}
                className={`
                  group relative flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-300
                  ${
                    isActive
                      ? 'bg-white/10 border border-white/20 text-white shadow-lg'
                      : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10'
                  }
                `}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${idx + 1}: ${s.title}`}
              >
                <span
                  className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
                    ${
                      isActive
                        ? `bg-gradient-to-br ${s.accent} text-white`
                        : 'bg-white/10 text-slate-500 group-hover:text-slate-300'
                    }
                  `}
                >
                  {idx + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                <Icon
                  className={`w-4 h-4 sm:hidden ${isActive ? 'text-white' : 'text-slate-500'}`}
                />
                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="tour-tab-underline"
                    className={`absolute -bottom-px left-3 right-3 h-0.5 bg-gradient-to-r ${s.accent} rounded-full`}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ---- Main tour viewport ---- */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Product tour steps"
        >
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Screenshot area (3 cols) */}
            <div className="lg:col-span-3 relative">
              {/* Glowing border frame */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  boxShadow: `0 0 60px ${step.glowColor}, 0 0 120px ${step.glowColor.replace('0.35', '0.15')}`,
                }}
              >
                {/* Inner glow border */}
                <div
                  className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 30px ${step.glowColor.replace('0.35', '0.08')}`,
                  }}
                />

                {/* Browser chrome mockup */}
                <div className="bg-[#111827] border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-white/[0.06] rounded-md px-3 py-1 text-xs text-slate-500 text-center truncate">
                      app.formaos.com.au
                    </div>
                  </div>
                </div>

                {/* Screenshot with AnimatePresence */}
                <div className="relative aspect-[16/10] bg-[#0d1117]">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step.id}
                      custom={direction}
                      variants={effectiveScreenshotVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0"
                    >
                      <Image
                        src={step.screenshot}
                        alt={step.title}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 60vw"
                        priority={step.id === 1}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Prev / Next arrows (overlaid on screenshot) */}
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
                aria-label="Next step"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Text content area (2 cols) */}
            <div className="lg:col-span-2 relative min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  variants={effectiveTextVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-5"
                >
                  {/* Step number badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent}`}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
                      Step {step.id} of {TOUR_STEPS.length}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    {step.title}
                  </h3>

                  <p className="text-base text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Progress bar (auto-advance indicator) */}
                  <div className="pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          key={`progress-${step.id}-${isPaused}-${isHovered}`}
                          className={`h-full bg-gradient-to-r ${step.accent} rounded-full`}
                          initial={{ width: '0%' }}
                          animate={{
                            width:
                              isPaused || isHovered ? undefined : '100%',
                          }}
                          transition={
                            isPaused || isHovered
                              ? { duration: 0 }
                              : {
                                  duration: AUTO_ADVANCE_MS / 1000,
                                  ease: 'linear',
                                }
                          }
                        />
                      </div>
                      <button
                        onClick={togglePause}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        aria-label={isPaused ? 'Resume auto-advance' : 'Pause auto-advance'}
                      >
                        {isPaused ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ---- Step dots (mobile-friendly secondary nav) ---- */}
          <div className="flex items-center justify-center gap-2 mt-8 lg:hidden">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToStep(idx)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${
                    idx === activeStep
                      ? 'bg-cyan-400 scale-125'
                      : 'bg-white/20 hover:bg-white/40'
                  }
                `}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
