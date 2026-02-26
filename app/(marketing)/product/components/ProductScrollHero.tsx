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
import { ComplianceCoreObject } from './ComplianceCoreObject';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const signatureEase: [number, number, number, number] = [...easing.signature] as [number, number, number, number];

/**
 * ProductScrollHero
 * ─────────────────
 * Cinematic scroll-driven hero for the Product page.
 *
 * Layout: Text at top → Core object below in center → scroll drives transformation
 * Total scroll: 250vh (sticky 100vh viewport)
 *
 * Scroll narrative:
 *   0–15%: Text fades up, core zooms + intensifies glow
 *   15–45%: Core layers separate in 3D, UI panels fan out
 *   45–80%: Core dissolves, product interface scales up
 *   80–100%: Product UI holds, then fades as section ends
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

  // ─── Text content: visible initially, fades out on scroll ───
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.04, 0.18, 0.28], [1, 1, 0.2, 0]);
  const headlineY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const headlineScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.92]);

  // ─── Core object: rises as text leaves ───
  const coreContainerY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  // ─── Phase labels ───
  const phase1Opacity = useTransform(scrollYProgress, [0.08, 0.14, 0.3, 0.38], [0, 1, 1, 0]);
  const phase2Opacity = useTransform(scrollYProgress, [0.3, 0.38, 0.5, 0.58], [0, 1, 1, 0]);
  const phase3Opacity = useTransform(scrollYProgress, [0.5, 0.58, 0.75, 0.85], [0, 1, 1, 0]);

  // ─── Bottom gradient bridge — fades in at end to bridge to next section ───
  const bridgeOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="product-scroll-hero relative"
      style={{ height: '250vh' }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Atmosphere */}
        <HeroAtmosphere topColor="violet" bottomColor="blue" particleIntensity="normal" />

        {/* Cinematic gradient orbs */}
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

        {/* ═══ TEXT CONTENT — top of viewport, fades up on scroll ═══ */}
        <motion.div
          className="absolute z-30 top-[10vh] sm:top-[12vh] left-0 right-0 text-center px-5 sm:px-6 lg:px-12"
          style={sa ? { opacity: headlineOpacity, y: headlineY, scale: headlineScale } : undefined}
        >
          {/* Badge */}
          <motion.div
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slow, delay: 0.15, ease: signatureEase } : { duration: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/30 mb-4 sm:mb-6 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-400 font-medium tracking-wide">Compliance Operating System</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={sa ? { opacity: 0, y: 30 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slower, delay: 0.27, ease: signatureEase } : { duration: 0 }}
            className="text-[2.25rem] sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-5 leading-[1.08] text-white max-w-4xl mx-auto"
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
            className="text-base sm:text-lg md:text-xl text-gray-400 mb-5 max-w-2xl mx-auto leading-relaxed"
          >
            Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={sa ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={sa ? { duration: duration.slower, delay: 0.48, ease: signatureEase } : { duration: 0 }}
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

        {/* ═══ 3D COMPLIANCE CORE — positioned below text, rises on scroll ═══ */}
        <motion.div
          className="absolute inset-x-0 bottom-0 top-[42vh] sm:top-[40vh] z-10 flex items-center justify-center"
          style={sa ? { y: coreContainerY } : undefined}
        >
          <ComplianceCoreObject
            scrollProgress={scrollYProgress}
            className="w-full h-full flex items-center justify-center"
          />
        </motion.div>

        {/* ═══ SCROLL PHASE LABELS ═══ */}
        <div className="absolute bottom-[6vh] sm:bottom-[8vh] left-0 right-0 z-30 text-center px-5">
          <motion.div style={{ opacity: phase1Opacity }} className="absolute inset-x-0 bottom-0">
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              The Compliance Core
            </p>
            <p className="text-[10px] sm:text-xs text-white/20 mt-1">Scroll to explore</p>
          </motion.div>
          <motion.div style={{ opacity: phase2Opacity }} className="absolute inset-x-0 bottom-0">
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              Structure → Controls → Evidence
            </p>
          </motion.div>
          <motion.div style={{ opacity: phase3Opacity }} className="absolute inset-x-0 bottom-0">
            <p className="text-xs sm:text-sm text-white/40 font-medium tracking-widest uppercase">
              Your Operating System
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator — top of page only */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.06], [0.6, 0]) }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>

        {/* Bottom gradient bridge to next section */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 z-20 pointer-events-none"
          style={{
            opacity: bridgeOpacity,
            background: 'linear-gradient(to bottom, transparent, rgba(6,10,20,1))',
          }}
        />
      </div>
    </section>
  );
}

export default ProductScrollHero;
