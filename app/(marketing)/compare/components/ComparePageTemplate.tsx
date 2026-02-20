'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';
import { DeferredSection } from '../../components/shared';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { duration, easing } from '@/config/motion';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export interface ComparePoint {
  title: string;
  detail: string;
}

export interface ComparePageTemplateProps {
  competitor: string;
  heroDescription: string;
  points: readonly ComparePoint[];
  idealIf: readonly string[];
  procurementChecks: readonly ComparePoint[];
  source: string;
}

export function ComparePageTemplate({
  competitor,
  heroDescription,
  points,
  idealIf,
  procurementChecks,
  source,
}: ComparePageTemplateProps) {
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
    <MarketingPageShell>
      {/* Hero */}
      <section
        ref={containerRef}
        className="mk-hero relative flex items-center justify-center overflow-hidden"
      >
        <HeroAtmosphere topColor="cyan" bottomColor="blue" />
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
                  ? {
                      opacity: contentOpacity,
                      scale: contentScale,
                      y: contentY,
                    }
                  : undefined
              }
              className="flex flex-col items-center text-center"
            >
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
                className="flex flex-wrap items-center justify-center gap-2 mb-8"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400 font-medium tracking-wide">
                    Comparison
                  </span>
                </span>
                <Link
                  href="/compare"
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back to Compare
                </Link>
              </motion.div>
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
                FormaOS vs {competitor}
              </motion.h1>
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
                {heroDescription}
              </motion.p>
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
                  href="/contact"
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
                  <span>Request Buyer Walkthrough</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <Link
                  href={`${appBase}/auth/signup?source=${source}`}
                  className="mk-btn mk-btn-secondary group px-8 py-4 text-lg"
                >
                  Start Free Trial
                </Link>
              </motion.div>
            </motion.div>
          </CursorTilt>
        </div>
      </section>

      <VisualDivider />

      {/* Differentiator Points */}
      <DeferredSection minHeight={320}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {points.map((p, i) => (
              <ScrollReveal
                key={p.title}
                variant="fadeUp"
                range={[i * 0.04, 0.3 + i * 0.04]}
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {p.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {p.detail}
                  </p>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Procurement Evaluation */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7">
              <h2 className="text-lg font-semibold text-white">
                Procurement Evaluation Focus
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {procurementChecks.map((check, i) => (
                  <ScrollReveal
                    key={check.title}
                    variant="fadeUp"
                    range={[i * 0.04, 0.3 + i * 0.04]}
                  >
                    <article className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                        {check.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {check.detail}
                      </p>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Ideal If + CTAs */}
      <DeferredSection minHeight={320}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                FormaOS is ideal if
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {idealIf.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/security-review"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Security Review Packet
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/frameworks"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Framework Coverage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                This page is an evaluation aid, not a claim of feature parity.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
