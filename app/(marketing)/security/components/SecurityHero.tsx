'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  Shield,
  Lock,
  FileCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function SecurityHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 50]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
    >
      <HeroAtmosphere topColor="rose" bottomColor="violet" gridColor="rose" />

      <motion.div
        style={{ scale: heroScale, y: heroY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-24"
      >
        {/* Security Shield Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.slow }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/40 to-orange-500/40 blur-xl"
            />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 rounded-2xl border border-white/20 shadow-2xl">
              <Shield className="h-12 w-12 text-red-400" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: duration.slower }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm"
        >
          <Lock className="h-3 w-3 text-red-400" />
          <span className="text-gray-300">Enterprise Security</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: duration.slower }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8"
        >
          <span className="text-white">Security that protects</span>
          <br />
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            what matters most
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: duration.slower }}
          className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Enterprise-grade security architecture designed for healthcare,
          government, and regulated industries. Every layer built to protect
          sensitive data and ensure compliance.
        </motion.p>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: duration.slower }}
          className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12"
        >
          {[
            { label: 'SOC 2-aligned', icon: CheckCircle },
            { label: 'ISO 27001-aligned', icon: Shield },
            { label: 'GDPR-ready workflows', icon: Lock },
            { label: 'HIPAA Aligned', icon: FileCheck },
          ].map((cert, index) => (
            <motion.div
              key={cert.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <cert.icon className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-gray-300">
                {cert.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: duration.slower }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/contact"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Request Security Overview</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          <Link
            href={`${appBase}/auth/signup`}
            className="group flex items-center justify-center gap-2 rounded-2xl border border-red-300/40 bg-[#0b1225] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-[#13203f]"
          >
            <span>Start Secure Trial</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
