'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { duration, easing } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';
import { ComplianceCoreObject } from './ComplianceCoreObject';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const signatureEase: [number, number, number, number] = [...easing.signature] as [number, number, number, number];

/**
 * ProductScrollHero
 * ─────────────────
 * Cinematic scroll-driven hero for the Product page.
 *
 * Scroll narrative (3 phases over ~300vh):
 *   Phase 1 — "The Core": Massive 3D compliance object floats, rotates, glows
 *   Phase 2 — "The Separation": Object layers spread apart, UI fragments emerge
 *   Phase 3 — "The Product": Object morphs into the actual FormaOS interface
 *
 * Mobile: Full effects via device tier system, auto-drift replaces cursor tilt.
 */

const FEATURE_CHIPS = [
  { label: 'Structured Controls', color: 'bg-teal-400' },
  { label: 'Owned Actions', color: 'bg-emerald-400' },
  { label: 'Live Evidence', color: 'bg-amber-400' },
];

export function ProductScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // ─── Text content transforms ───
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.08, 0.35, 0.45], [1, 1, 0.3, 0]);
  const headlineY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const headlineScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Phase labels
  const phase1LabelOpacity = useTransform(scrollYProgress, [0.12, 0.18, 0.35, 0.42], [0, 1, 1, 0]);
  const phase2LabelOpacity = useTransform(scrollYProgress, [0.35, 0.42, 0.55, 0.62], [0, 1, 1, 0]);
  const phase3LabelOpacity = useTransform(scrollYProgress, [0.55, 0.62, 0.8, 0.88], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="product-scroll-hero relative"
      style={{ height: '300vh' }}
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {/* Atmosphere */}
        <HeroAtmosphere topColor="violet" bottomColor="blue" particleIntensity="normal" />

        {/* Extra cinematic gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-gradient-to-br from-violet-500/12 via-blue-500/8 to-transparent rounded-full blur-3xl"
            animate={sa ? { scale: [1, 1.08, 1], opacity: [0.2, 0.3, 0.2] } : undefined}
            transition={sa ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />
          <motion.div
            className="absolute -bottom-20 -right-20 sm:-bottom-40 sm:-right-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-tl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl"
            animate={sa ? { scale: [1, 1.12, 1], opacity: [0.15, 0.25, 0.15] } : undefined}
            transition={sa ? { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 } : undefined}
          />
        </div>

        {/* ═══ TEXT CONTENT (fades out as user scrolls) ═══ */}
        <motion.div
          className="absolute z-20 top-[12vh] sm:top-[14vh] left-0 right-0 text-center px-5 sm:px-6 lg:px-12"
          style={sa ? { opacity: headlineOpacity, y: headlineY, scale: headlineScale } : undefined}
        >
          {/* Badge */}
          <motion.div
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slow, delay: 0.15, ease: signatureEase } : { duration: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/30 mb-6 sm:mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-400 font-medium tracking-wide">Compliance Operating System</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={sa ? { opacity: 0, y: 30 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slower, delay: 0.27, ease: signatureEase } : { duration: 0 }}
            className="text-[2.5rem] sm:text-5xl lg:text-7xl font-bold mb-5 sm:mb-6 leading-[1.08] text-white max-w-4xl mx-auto"
          >
            The Compliance OS
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              for Real Organizations
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slower, delay: 0.39, ease: signatureEase } : { duration: 0 }}
            className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed"
          >
            Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
          </motion.p>

          {/* Feature chips */}
          <motion.div
            initial={sa ? { opacity: 0, y: 15 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slow, delay: 0.48, ease: signatureEase } : { duration: 0 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 text-sm text-slate-500"
          >
            {FEATURE_CHIPS.map((chip) => (
              <span key={chip.label} className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
                {chip.label}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slower, delay: 0.57, ease: signatureEase } : { duration: 0 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto items-center"
          >
            <motion.a
              href={`${appBase}/auth/signup`}
              whileHover={sa ? { scale: 1.03, boxShadow: '0 0 30px rgba(139,92,246,0.3)' } : undefined}
              whileTap={sa ? { scale: 0.98 } : undefined}
              className="mk-btn mk-btn-primary group px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <Link
              href="/contact"
              className="mk-btn mk-btn-secondary group px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              <Play className="w-5 h-5" />
              <span>Request Demo</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* ═══ COMPLIANCE CORE OBJECT ═══ */}
        <div className="absolute inset-0 flex items-center justify-center z-10 mt-[8vh] sm:mt-[5vh]">
          <ComplianceCoreObject
            scrollProgress={scrollYProgress}
            className="w-full h-full flex items-center justify-center"
          />
        </div>

        {/* ═══ SCROLL PHASE LABELS ═══ */}
        <div className="absolute bottom-[8vh] sm:bottom-[10vh] left-0 right-0 z-30 text-center px-5">
          {/* Phase 1 */}
          <motion.div
            style={{ opacity: phase1LabelOpacity }}
            className="absolute inset-x-0 bottom-0"
          >
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              The Compliance Core
            </p>
            <p className="text-[10px] sm:text-xs text-white/20 mt-1">Scroll to explore →</p>
          </motion.div>

          {/* Phase 2 */}
          <motion.div
            style={{ opacity: phase2LabelOpacity }}
            className="absolute inset-x-0 bottom-0"
          >
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              Structure → Controls → Evidence
            </p>
          </motion.div>

          {/* Phase 3 */}
          <motion.div
            style={{ opacity: phase3LabelOpacity }}
            className="absolute inset-x-0 bottom-0"
          >
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              Your Operating System
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator — only visible at top */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProductScrollHero;
