'use client';

import { useRef } from 'react';
import { BookOpen, Search, Rocket, Code, Shield, Zap } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { duration } from '@/config/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';

const quickLinks = [
  { title: 'Quick Start', description: 'Get running in 15 minutes', icon: Rocket, href: '#getting-started' },
  { title: 'API Reference', description: 'Complete API documentation', icon: Code, href: '#integrations' },
  { title: 'Security Docs', description: 'Enterprise security details', icon: Shield, href: '#security' },
  { title: 'Troubleshooting', description: 'Solve common issues', icon: Zap, href: '#support' },
];

export function DocsHero() {
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
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      <HeroAtmosphere topColor="blue" bottomColor="emerald" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <CursorTilt intensity={3} glowFollow glowColor="59,130,246" className="w-full">
        <div className="flex flex-col items-center text-center">
          <motion.div style={shouldReduceMotion ? undefined : { opacity, scale, y }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">Knowledge Base</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              FormaOS{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Documentation
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Comprehensive guides, tutorials, and API references to help you
              master the compliance operating system.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.85 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
                delay: 0.55,
              }}
              className="w-full max-w-xl mx-auto mb-10 relative"
            >
              {/* Animated glow ring behind search bar */}
              {!shouldReduceMotion && (
                <motion.div
                  className="absolute -inset-3 rounded-3xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 0.6, 0.3], scale: [0.95, 1.02, 1] }}
                  transition={{
                    duration: 2,
                    delay: 0.8,
                    ease: 'easeOut',
                  }}
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.15), rgba(59,130,246,0.08), transparent 70%)',
                  }}
                />
              )}
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <motion.input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm text-lg"
                  whileFocus={shouldReduceMotion ? undefined : { scale: 1.02, borderColor: 'rgba(34,211,238,0.4)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto"
            >
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.title}
                    href={link.href}
                    className="group flex flex-col items-center text-center p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-cyan-500/30 hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">{link.description}</span>
                  </a>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
        </CursorTilt>
      </div>
    </section>
  );
}
