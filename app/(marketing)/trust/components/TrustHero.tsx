'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { brand } from '@/config/brand';
import { easing, duration } from '@/config/motion';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function TrustHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
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
      ref={sectionRef}
      className="mk-hero relative flex items-center justify-center overflow-hidden"
    >
      <HeroAtmosphere topColor="blue" bottomColor="amber" />

      {/* Pulsing trust glow */}
      <motion.div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        animate={
          sa ? { scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] } : undefined
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt
          intensity={3}
          glowFollow
          glowColor="59,130,246"
          className="w-full"
        >
          <motion.div
            style={
              sa
                ? { opacity: contentOpacity, scale: contentScale, y: contentY }
                : undefined
            }
            className="flex flex-col items-center text-center"
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
                      ease: [...easing.signature] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }
                  : { duration: 0 }
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Trust-as-Revenue
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
                      ease: [...easing.signature] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }
                  : { duration: 0 }
              }
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Enterprise Trust Center
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 bg-clip-text text-transparent">
                for Faster Security Reviews
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
                      ease: [...easing.signature] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }
                  : { duration: 0 }
              }
              className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto text-center leading-relaxed"
            >
              FormaOS gives customers and auditors controlled visibility into
              live compliance posture, evidence integrity, and security
              governance artifacts.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                sa
                  ? {
                      duration: duration.slower,
                      delay: 0.7,
                      ease: [...easing.signature] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }
                  : { duration: 0 }
              }
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.a
                href={`${appBase}/auth/signup?source=trust_center`}
                whileHover={
                  sa
                    ? {
                        scale: 1.03,
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
                      }
                    : undefined
                }
                whileTap={sa ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group px-8 py-4 text-lg"
              >
                <span>Start Trust-Ready Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary group px-8 py-4 text-lg"
              >
                Request Security Review Walkthrough
              </Link>
            </motion.div>
          </motion.div>
        </CursorTilt>
      </div>
    </section>
  );
}
