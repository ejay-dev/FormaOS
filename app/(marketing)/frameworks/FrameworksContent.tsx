'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const frameworkPacks = [
  {
    name: 'ISO 27001',
    notes: 'Control packs aligned for security management systems.',
  },
  {
    name: 'SOC 2',
    notes: 'Trust Services Criteria mapped into executable work.',
  },
  {
    name: 'GDPR',
    notes: 'Privacy obligations mapped to controls and evidence.',
  },
  {
    name: 'HIPAA',
    notes: 'Healthcare safeguards mapped for defensible operations.',
  },
  {
    name: 'PCI DSS',
    notes: 'Payment security requirements mapped to control tasks.',
  },
  {
    name: 'NIST',
    notes: 'Risk and control model alignment for security programs.',
  },
  {
    name: 'CIS',
    notes: 'Baseline hardening and operational control coverage.',
  },
] as const;

const principles = [
  {
    icon: Layers,
    title: 'Frameworks become work',
    detail:
      'Controls map into tasks, owners, deadlines, and evidence requirements. Your compliance program executes continuously.',
  },
  {
    icon: Target,
    title: 'Evidence stays contextual',
    detail:
      'Evidence is linked to the control and the workflow that produced it, with verification status and audit history.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready exports',
    detail:
      'Generate defensible bundles and posture snapshots without rebuilding spreadsheets every quarter.',
  },
] as const;

export default function FrameworksContent() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
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

  return (
    <MarketingPageShell>
      {/* Hero */}
      <section
        ref={heroRef}
        className="mk-hero relative flex items-center justify-center overflow-hidden"
      >
        <HeroAtmosphere topColor="blue" bottomColor="violet" />
        <motion.div
          style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}
          className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
        >
          <CursorTilt intensity={3} glowFollow glowColor="96,165,250">
            <div className="flex flex-col items-center text-center">
              <Reveal variant="fadeInUp">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
                  <Layers className="h-4 w-4" />
                  Framework Coverage
                </div>
              </Reveal>
              <Reveal variant="fadeInUp" delay={0.1}>
                <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] text-white">
                  Framework-mapped controls, built for execution
                </h1>
              </Reveal>
              <Reveal variant="fadeInUp" delay={0.2}>
                <p className="mt-5 max-w-3xl text-lg sm:text-xl leading-relaxed text-slate-300">
                  FormaOS ships framework packs that map obligations into
                  controls and evidence workflows. This is alignment and
                  operational mapping, not a certification claim.
                </p>
              </Reveal>
              <Reveal variant="fadeInUp" delay={0.3}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`${appBase}/auth/signup?source=frameworks`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/security-review"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Security Review Packet
                  </Link>
                </div>
              </Reveal>
            </div>
          </CursorTilt>
        </motion.div>
      </section>

      <VisualDivider />

      {/* Principles */}
      <DeferredSection minHeight={280}>
        <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {principles.map((p, i) => (
              <ScrollReveal
                key={p.title}
                variant="scaleUp"
                range={[0, 0.3 + i * 0.05]}
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <p.icon className="h-5 w-5 text-cyan-200" />
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

      <VisualDivider />

      {/* Framework Packs */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Included Framework Packs
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Packs represent mapped control structures and workflow
                    defaults. Actual applicability varies by organization and
                    scope.
                  </p>
                </div>
                <Link
                  href="/trust"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Trust Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {frameworkPacks.map((f, i) => (
                  <ScrollReveal
                    key={f.name}
                    variant="fadeUp"
                    range={[0, 0.3 + i * 0.04]}
                  >
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {f.name}
                          </div>
                          <div className="mt-1 text-xs leading-relaxed text-slate-300">
                            {f.notes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <p className="mt-6 text-xs text-slate-500">
                FormaOS can help accelerate audits by making control execution
                and evidence defensible. It does not imply certification status.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
