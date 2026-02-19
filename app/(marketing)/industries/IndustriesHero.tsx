'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { Globe, Shield, Heart, Users, ArrowRight } from 'lucide-react';
import {
  ParallaxLayer,
} from '@/components/motion';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function IndustriesHero() {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      <AmbientParticleLayer intensity="subtle" />
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      {/* Ambient lights */}
      <div className="pointer-events-none absolute top-20 right-1/4 h-[500px] w-[500px] rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[80px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <ParallaxLayer speed={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.slower,
              ease: [...easing.signature],
            }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 rounded-full glass-intense px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-secondary/30"
            >
              <Globe className="h-4 w-4 text-secondary" />
              Industry Frameworks
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] font-display tracking-tight">
              Frameworks Engineered
              <br />
              <span className="relative">
                <span className="text-gradient">for Your Sector</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: duration.slower }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-accent to-primary rounded-full origin-left"
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed">
              Pre-configured compliance frameworks for Australian health,
              disability, aged care, and community services. Audit-ready from
              day one.
            </p>

            {/* Industry pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Shield, label: 'NDIS', color: 'text-blue-400' },
                { icon: Heart, label: 'Healthcare', color: 'text-rose-400' },
                { icon: Users, label: 'Aged Care', color: 'text-purple-400' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-panel rounded-full px-5 py-3 flex items-center gap-2 hover:glass-intense transition-all group"
                >
                  <item.icon
                    className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`}
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link
                href={`${appBase}/auth/signup`}
                className="mk-btn mk-btn-primary text-lg px-8 py-4 group"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary text-lg px-8 py-4"
              >
                Talk to Specialist
              </Link>
            </motion.div>
          </motion.div>
        </ParallaxLayer>
      </div>
    </section>
  );
}
