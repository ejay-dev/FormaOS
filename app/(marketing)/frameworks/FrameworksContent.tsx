'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { FrameworksHeroVisual } from './components/FrameworksHeroVisual';

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
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="frameworks"
        visualContent={<FrameworksHeroVisual />}
        badge={{ icon: <Layers className="h-4 w-4" />, text: 'Framework Coverage' }}
        headline="Framework-mapped controls, built for execution"
        subheadline="FormaOS ships framework packs that map obligations into controls and evidence workflows. This is alignment and operational mapping, not a certification claim."
        primaryCta={{ href: `${appBase}/auth/signup?source=frameworks`, label: 'Start Free Trial' }}
        secondaryCta={{ href: '/security-review', label: 'Security Review Packet' }}
      />

      <VisualDivider />

      {/* Principles */}
      <DeferredSection minHeight={280}>
        <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionChoreography pattern="depth-reveal" className="grid gap-4 lg:grid-cols-3">
            {principles.map((p) => (
              <motion.article
                key={p.title}
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
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Framework Packs */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthScale" range={[0, 0.35]}>
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

              <SectionChoreography pattern="depth-reveal" className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {frameworkPacks.map((f) => (
                  <div key={f.name} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
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
                ))}
              </SectionChoreography>

              <p className="mt-6 text-xs text-slate-500">
                FormaOS can help accelerate audits by making control execution
                and evidence defensible. It does not imply certification status.
              </p>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
