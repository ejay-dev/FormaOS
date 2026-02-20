'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { brand } from '@/config/brand';
import { easing, duration } from '@/config/motion';
import { isCareLaunchMode } from '@/lib/vertical-launch';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const careLaunchMode = isCareLaunchMode();

export function TrustHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[70vh] overflow-hidden"
    >
      <HeroAtmosphere topColor="blue" bottomColor="amber" />

      {/* Pulsing trust glow */}
      <motion.div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)' }}
      />

      {/* Hero content */}
      <CursorTilt intensity={3} glowFollow glowColor="59,130,246" className="relative z-10">
      <motion.div
        style={
          shouldReduceMotion
            ? undefined
            : { y: heroY, opacity: heroOpacity }
        }
        className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36"
      >
        <Reveal variant="fadeInUp" delay={0}>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
            {careLaunchMode ? 'Care Provider Trust' : 'Trust-as-Revenue'}
          </div>
        </Reveal>

        <Reveal variant="fadeInUp" delay={0.1}>
          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            {careLaunchMode
              ? 'Trust Center for Care Provider Data Protection'
              : 'Enterprise Trust Center for Faster Security Review Cycles'}
          </h1>
        </Reveal>

        <Reveal variant="fadeInUp" delay={0.2}>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {careLaunchMode
              ? 'FormaOS gives auditors, participants, and regulators controlled visibility into your NDIS compliance posture, care evidence integrity, and security governance.'
              : 'FormaOS gives customers and auditors controlled visibility into live compliance posture, evidence integrity, and security governance artifacts.'}
          </p>
        </Reveal>

        <Reveal variant="fadeInUp" delay={0.3}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${appBase}/auth/signup?source=trust_center`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)]"
            >
              Start Trust-Ready Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Request Security Review Walkthrough
            </Link>
          </div>
        </Reveal>
      </motion.div>
      </CursorTilt>
    </section>
  );
}
