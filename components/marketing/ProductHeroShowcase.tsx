'use client';

/**
 * ProductHeroShowcase — /product page hero + screenshot showcase
 *
 * Exports:
 *   ProductHero     — Traditional marketing hero (headline, gradient, CTAs)
 *   ProductShowcase — Screenshot carousel below the hero
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { easing, duration } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION — traditional marketing hero at the top
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.9, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.97]);

  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 pb-20"
      style={{ opacity: heroOpacity, scale: heroScale }}
    >
      <HeroAtmosphere topColor="teal" bottomColor="amber" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <CursorTilt intensity={3} glowFollow glowColor="45,212,191">
        <motion.div
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500/[0.08] border border-teal-500/25 mb-8"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">Compliance Operating System</span>
        </motion.div>

        <motion.h1
          initial={sa ? { opacity: 0, y: 28 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.25 } : { duration: 0 }}
          className="text-4xl sm:text-5xl lg:text-7xl xl:text-[5.2rem] font-bold mb-8 leading-[1.05] tracking-tight text-white"
        >
          The Compliance OS
          <br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            for Real Organizations
          </span>
        </motion.h1>

        <motion.p
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.4 } : { duration: 0 }}
          className="text-lg sm:text-xl lg:text-2xl text-slate-400 mb-6 max-w-3xl mx-auto leading-relaxed"
        >
          Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
        </motion.p>

        <motion.p
          initial={sa ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
          className="text-sm sm:text-base text-slate-500 mb-12 max-w-xl mx-auto"
        >
          Used by compliance teams. Aligned to ISO &amp; SOC frameworks. Built for audit defensibility.
        </motion.p>

        <motion.div
          initial={sa ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slower, delay: 0.55 } : { duration: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <motion.a
            href={`${appBase}/auth/signup`}
            whileHover={sa ? { scale: 1.03, boxShadow: '0 0 40px rgba(20,184,166,0.3)' } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group px-10 py-4 text-base lg:text-lg"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="/contact"
            whileHover={sa ? { scale: 1.03 } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-secondary group px-10 py-4 text-base lg:text-lg"
          >
            <span>Request Demo</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={sa ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={sa ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
          className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500"
        >
          {[
            { label: 'Structured Controls', color: 'bg-teal-400' },
            { label: 'Owned Actions', color: 'bg-emerald-400' },
            { label: 'Live Evidence', color: 'bg-amber-400' },
          ].map((chip) => (
            <span key={chip.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
              {chip.label}
            </span>
          ))}
        </motion.div>
        </CursorTilt>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHOWCASE — screenshot carousel below the hero
   ═══════════════════════════════════════════════════════════════════════ */

interface ShowcaseView {
  id: string;
  label: string;
  icon: string;
  screenshot: string;
  description: string;
  glowColor: string;
}

const SHOWCASE_VIEWS: ShowcaseView[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', screenshot: '/marketing/screenshots/dashboard.png', description: 'Real-time compliance posture, active tasks, and control health at a glance.', glowColor: '45,212,191' },
  { id: 'evidence', label: 'Evidence', icon: '◉', screenshot: '/marketing/screenshots/vault.png', description: 'Collect, organize, and link evidence artifacts to controls automatically.', glowColor: '251,191,36' },
  { id: 'controls', label: 'Controls', icon: '⬡', screenshot: '/marketing/screenshots/compliance.png', description: 'Map obligations to controls across SOC 2, ISO 27001, and custom frameworks.', glowColor: '52,211,153' },
  { id: 'reports', label: 'Reports', icon: '◈', screenshot: '/marketing/screenshots/reports.png', description: 'Generate audit-ready reports and board-level compliance summaries on demand.', glowColor: '52,211,153' },
  { id: 'risk', label: 'Risk', icon: '△', screenshot: '/marketing/screenshots/dashboard.png', description: 'Track open risks, vendor assessments, and incident logs in one register.', glowColor: '251,191,36' },
  { id: 'policies', label: 'Policies', icon: '▣', screenshot: '/marketing/screenshots/settings.png', description: 'Manage policy lifecycle — drafting, review, approval, and version control.', glowColor: '251,113,133' },
];

const AUTO_ADVANCE_MS = 5000;

const signatureEase: [number, number, number, number] = [...easing.signature];
const exitEase: [number, number, number, number] = [...easing.exit];

const screenshotVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: duration.slow, ease: signatureEase } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.97, transition: { duration: duration.normal, ease: exitEase } }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);

  const view = SHOWCASE_VIEWS[activeIndex];
  const variants = prefersReduced ? reducedVariants : screenshotVariants;

  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  }, [activeIndex]);

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % SHOWCASE_VIEWS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + SHOWCASE_VIEWS.length) % SHOWCASE_VIEWS.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(goNext, AUTO_ADVANCE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHovered, goNext]);

  // Keyboard nav
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  return (
    <motion.section
      ref={containerRef}
      className="relative py-16 sm:py-20 overflow-hidden"
      style={{ opacity: sectionOpacity }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product screenshots"
    >
      {/* Section border */}
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.15) 50%, transparent 100%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* View selector pills */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8 sm:mb-10 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SHOWCASE_VIEWS.map((v, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => goTo(idx)}
                className={`
                  relative flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-200 shrink-0
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40
                  ${isActive
                    ? 'bg-white/10 border border-white/20 text-white shadow-lg'
                    : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10'
                  }
                `}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className={`text-base ${isActive ? '' : 'opacity-60'}`}>{v.icon}</span>
                <span className="hidden sm:inline">{v.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="showcase-tab-underline"
                    className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full"
                    style={{ background: `rgba(${v.glowColor},0.7)` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Screenshot in browser frame */}
        <div className="relative max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: `0 0 80px rgba(${view.glowColor},0.12), 0 0 160px rgba(${view.glowColor},0.06), 0 32px 64px rgba(0,0,0,0.4)`,
              transition: 'box-shadow 0.4s ease-out',
            }}
          >
            {/* Inner glow border */}
            <div
              className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 30px rgba(${view.glowColor},0.06)`,
                transition: 'box-shadow 0.4s ease-out',
              }}
            />

            {/* Browser chrome */}
            <div className="bg-[#111827] border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-white/[0.06] rounded-md px-3 py-1 text-xs text-slate-500 text-center truncate">
                  app.formaos.com.au / {view.id}
                </div>
              </div>
            </div>

            {/* Screenshot */}
            <div className="relative aspect-[16/10] bg-[#0d1117]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={view.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <Image
                    src={view.screenshot}
                    alt={`FormaOS ${view.label} view`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 960px"
                    priority={view.id === 'dashboard'}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Prev / Next arrows */}
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
            aria-label="Previous view"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
            aria-label="Next view"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        <div className="text-center mt-6 sm:mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: signatureEase }}
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5">{view.label}</h3>
              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">{view.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {SHOWCASE_VIEWS.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => goTo(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'scale-125'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              style={idx === activeIndex ? { background: `rgba(${v.glowColor},0.7)` } : undefined}
              aria-label={`Go to ${v.label}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BACKWARD-COMPAT ALIASES (used by ProductPageContent dynamic imports)
   ═══════════════════════════════════════════════════════════════════════ */

export { ProductHero as ProductHeroAnimation };
export { ProductShowcase as ProductHeroCopy };

export default ProductHero;
