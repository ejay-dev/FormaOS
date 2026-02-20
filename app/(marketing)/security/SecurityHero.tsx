'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { Lock, Shield, Eye, FileCheck, ArrowRight } from 'lucide-react';
import { duration, easing } from '@/config/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function SecurityHero() {
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
      <HeroAtmosphere topColor="cyan" bottomColor="blue" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt
          intensity={3}
          glowFollow
          glowColor="34,211,238"
          className="w-full"
        >
          <motion.div
            style={
              sa
                ? { opacity: contentOpacity, scale: contentScale, y: contentY }
                : undefined
            }
            className="text-center flex flex-col items-center"
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
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Security Architecture
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
              Enterprise Security
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
                by Design
              </span>
            </motion.h1>

            {/* Subtitle */}
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
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Audit-grade logging, tenant isolation, and compliance gates
              engineered for organizations where security and data integrity are
              regulatory requirements.
            </motion.p>

            {/* Security feature pills */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                sa
                  ? {
                      duration: duration.slower,
                      delay: 0.6,
                      ease: [...easing.signature] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }
                  : { duration: 0 }
              }
              className="flex flex-wrap justify-center gap-3 mb-10"
            >
              {[
                { icon: Lock, label: 'Tenant Isolation' },
                { icon: FileCheck, label: 'Immutable Logs' },
                { icon: Eye, label: 'Evidence Chain' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm"
                >
                  <item.icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>

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
                href={`${appBase}/auth/signup`}
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
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary group px-8 py-4 text-lg"
              >
                Security Briefing
              </Link>
            </motion.div>
          </motion.div>
        </CursorTilt>
      </div>
    </section>
  );
}
