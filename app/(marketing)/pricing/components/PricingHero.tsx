'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Check, DollarSign, ArrowRight } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { brand } from '@/config/brand';
import { easing, duration } from '@/config/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function PricingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Buffered hero exit: hold fully visible first, then progressive cinematic fade
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.24, 0.82, 0.96],
    [1, 1, 0.35, 0],
  );
  const contentScale = useTransform(
    scrollYProgress,
    [0, 0.24, 0.82, 0.96],
    [1, 1, 0.97, 0.94],
  );
  const contentY = useTransform(scrollYProgress, [0, 0.82, 1], [0, 52, 110]);
  const sa = !shouldReduceMotion;

  return (
    <section
      ref={containerRef}
      className="mk-hero relative flex items-center justify-center overflow-hidden"
    >
      <HeroAtmosphere topColor="emerald" bottomColor="cyan" />

      {/* Gradient mesh — shifts slowly on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(52,211,153,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(34,211,238,0.04) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt
          intensity={3}
          glowFollow
          glowColor="52,211,153"
          className="w-full"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              style={
                sa
                  ? {
                      opacity: contentOpacity,
                      scale: contentScale,
                      y: contentY,
                    }
                  : undefined
              }
            >
              {/* Badge */}
              <motion.div
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slow,
                        delay: 0.2,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium tracking-wide">
                  Transparent Pricing
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={sa ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.3,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
              >
                Compliance Infrastructure,
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  Scaled to Your Organization
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.5,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
              >
                FormaOS is not a productivity tool.
                <br />
                It is a compliance operating system.
              </motion.p>

              {/* Supporting Copy */}
              <motion.p
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.6,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="text-base text-gray-500 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
              >
                Our pricing reflects the level of governance, automation, and
                regulatory accountability your organization requires, from
                foundational process tracking to enterprise-wide audit
                infrastructure.
              </motion.p>
              <motion.p
                initial={sa ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.7,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="text-xs text-gray-500 mb-6 max-w-2xl mx-auto text-center"
              >
                Used by compliance teams. Aligned to ISO/SOC frameworks. Built
                for audit defensibility.
              </motion.p>

              {/* Value Props */}
              <motion.div
                initial={sa ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.7,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="mb-10 flex flex-col items-center gap-4"
              >
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Clear feature tiers
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Transparent entitlements
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Upgrade any time
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
                    Security review packet
                  </span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1">
                    No setup fee
                  </span>
                  <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
                    14-day trial
                  </span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={sa ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.8,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href={`${appBase}/auth/signup`}
                  data-testid="pricing-hero-start-trial"
                  className="mk-btn mk-btn-primary group px-8 py-4 text-base"
                >
                  <span className="relative z-10">Start Free Trial</span>
                </Link>
                <Link
                  href="/contact"
                  className="mk-btn mk-btn-secondary group flex items-center justify-center gap-2 px-8 py-4 text-base"
                >
                  <span>Contact Sales</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
              <motion.div
                initial={sa ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  sa
                    ? {
                        duration: duration.slower,
                        delay: 0.9,
                        ease: easing.signature,
                      }
                    : { duration: 0 }
                }
                className="mt-4"
              >
                <Link
                  href="/security-review"
                  className="text-sm font-medium text-cyan-300 underline decoration-cyan-500/60 underline-offset-4 hover:text-cyan-200"
                >
                  Review procurement security packet
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </CursorTilt>
      </div>
    </section>
  );
}
