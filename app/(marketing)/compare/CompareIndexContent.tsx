'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { duration, easing } from '@/config/motion';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const comparisons = [
  {
    href: '/compare/vanta',
    name: 'Vanta',
    tagline: 'Compliance automation vs compliance execution OS',
  },
  {
    href: '/compare/drata',
    name: 'Drata',
    tagline: 'Continuous monitoring vs operational workflow governance',
  },
  {
    href: '/compare/secureframe',
    name: 'Secureframe',
    tagline: 'Program setup vs defensible workflow and evidence chain',
  },
] as const;

const differentiators = [
  'Operational accountability: tasks, owners, deadlines, and audit history',
  'Evidence defensibility: verification workflows and chain-of-custody context',
  'Cross-surface trust: buyer-facing assurance and posture snapshots',
  'Built for regulated operators, not only security teams',
] as const;

const evaluationPlaybook = [
  {
    title: '1. Define outcomes, not pages',
    detail:
      'Assess whether the platform helps your team evaluate risk, prove readiness, and operate controls continuously.',
  },
  {
    title: '2. Validate workflow defensibility',
    detail:
      'Test if tasks, evidence, ownership, and approvals stay connected in one auditable chain-of-custody.',
  },
  {
    title: '3. Run a buyer-grade trust review',
    detail:
      'Use a procurement lens: security review packet, trust artifacts, and objection handling for legal/security teams.',
  },
] as const;

export default function CompareIndexContent() {
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
              >
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium tracking-wide">
                  Compare
                </span>
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
                Evaluate FormaOS Against
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 bg-clip-text text-transparent">
                  Modern Compliance Tools
                </span>
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
                Many platforms help you prepare for an audit. FormaOS is
                designed to operate compliance continuously: enforce controls as
                workflows and keep evidence defensible by default.
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
                  <span>Request Evaluation Walkthrough</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <Link
                  href={`${appBase}/auth/signup?source=compare`}
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

      {/* Competitor Cards */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {comparisons.map((c, i) => (
              <ScrollReveal
                key={c.href}
                variant="fadeUp"
                range={[i * 0.04, 0.3 + i * 0.04]}
              >
                <motion.div whileHover={{ y: -6 }}>
                  <Link
                    href={c.href}
                    className="group block rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Compare
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      FormaOS vs {c.name}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{c.tagline}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                      View comparison
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Differentiators */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  What FormaOS is optimized for
                </h2>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 text-sm text-slate-300">
                {differentiators.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-slate-500">
                Comparisons are high-level and intended for evaluation. Specific
                feature parity varies by plan and deployment.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>

      {/* Evaluation Playbook */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {evaluationPlaybook.map((step, i) => (
              <ScrollReveal
                key={step.title}
                variant="fadeUp"
                range={[i * 0.04, 0.3 + i * 0.04]}
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {step.detail}
                  </p>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
