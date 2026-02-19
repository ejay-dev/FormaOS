'use client';

import { useRef, useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function ProductHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -15%'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.34, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.26, 0.82, 0.96], [1, 1, 0.97, 0.94]);
  const y = useTransform(scrollYProgress, [0, 0.82, 1], [0, 48, 110]);
  const shouldAnimateIntro = !shouldReduceMotion && allowHeavyVisuals;

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
    >
      <HeroAtmosphere topColor="cyan" bottomColor="violet" gridColor="cyan" particleIntensity="normal" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt intensity={3} glowFollow glowColor="6,182,212" className="w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div style={{ opacity, scale, y }}>
              <motion.div
                initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.2 } : { duration: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium tracking-wide">
                  Compliance Operating System
                </span>
              </motion.div>

              <motion.h1
                initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
              >
                The Compliance OS
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  for Real Organizations
                </span>
              </motion.h1>

              <motion.p
                initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
                className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
              >
                FormaOS is not a document manager. It is a purpose-built operating
                system that transforms regulatory obligations into structured
                controls, owned actions, live evidence, and audit-ready outcomes.
              </motion.p>
              <motion.p
                initial={shouldAnimateIntro ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.6 } : { duration: 0 }}
                className="text-xs sm:text-sm text-gray-500 mb-6 max-w-3xl mx-auto text-center"
              >
                Used by compliance teams. Aligned to ISO/SOC frameworks. Built for
                audit defensibility.
              </motion.p>

              <motion.div
                initial={shouldAnimateIntro ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
                className="mb-10 max-w-2xl mx-auto text-center"
              >
                <p className="text-sm text-gray-500 mb-4">
                  Where traditional tools store files, FormaOS runs compliance
                  across your organization in real time.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Structured Controls
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Owned Actions
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Live Evidence
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.7 } : { duration: 0 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <motion.a
                  href={`${appBase}/auth/signup`}
                  whileHover={
                    shouldAnimateIntro
                      ? { scale: 1.05, boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }
                      : undefined
                  }
                  whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-primary group px-8 py-4 text-lg"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                <motion.a
                  href="/contact"
                  whileHover={shouldAnimateIntro ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
                  className="mk-btn mk-btn-secondary group px-8 py-4 text-lg"
                >
                  <span>Request Demo</span>
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </CursorTilt>
      </div>
    </section>
  );
}
