'use client';

import { useRef } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function IndustriesHero() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      <HeroAtmosphere topColor="amber" bottomColor="rose" />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt intensity={3} glowFollow glowColor="251,191,36" className="w-full">
        <div className="flex flex-col items-center text-center">
          <motion.div style={shouldReduceMotion ? undefined : { opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.2, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-8 backdrop-blur-sm"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium tracking-wide">
                Industry Solutions
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.3, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              One OS. Multiple
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Regulatory Frameworks.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.5, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS adapts to your industry&apos;s requirements. Pre-built
              frameworks. Enforced controls. Evidence that auditors trust.
            </motion.p>

            {/* Industry Context */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: duration.slower, delay: 0.65, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Framework-agnostic compliance infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  NDIS & Aged Care
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Healthcare
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Financial Services
                </span>
              </div>

              {/* Industry pulse signature */}
              <div className="mt-5 flex items-end justify-center gap-6">
                {[
                  { label: 'NDIS', color: 'bg-pink-400' },
                  { label: 'Health', color: 'bg-blue-400' },
                  { label: 'Finance', color: 'bg-amber-400' },
                  { label: 'Gov', color: 'bg-emerald-400' },
                ].map((vertical, index) => (
                  <div key={vertical.label} className="flex flex-col items-center gap-2">
                    <div className="relative h-12 w-px bg-white/15 overflow-visible">
                      <motion.span
                        className={`absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 rounded-full ${vertical.color}`}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                y: [0, -36, 0],
                                opacity: [0.5, 1, 0.5],
                                scale: [0.9, 1.2, 0.9],
                              }
                        }
                        transition={{
                          duration: 2.8,
                          delay: index * 0.25,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      {vertical.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.7, ease: ([...easing.signature] as [number, number, number, number]) }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(251, 191, 36, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all"
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

export default IndustriesHero;
