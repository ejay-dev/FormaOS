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
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { FrameworksHeroVisual } from './components/FrameworksHeroVisual';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  PUBLIC_CTA_LABELS,
  securityReviewHref,
} from '@/lib/marketing/cta';

const frameworkPacks = [
  {
    name: 'ISO 27001',
    notes:
      'Annex A controls mapped to FormaOS work items, Statement of Applicability worksheet, and risk register linked back to evidence.',
  },
  {
    name: 'SOC 2',
    notes:
      'Trust Services Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy) mapped into executable, owner-assigned work.',
  },
  {
    name: 'GDPR',
    notes:
      'Privacy obligations including Article 28 processor terms, DPIA workflows, and data subject request handling mapped to controls and evidence.',
  },
  {
    name: 'HIPAA',
    notes:
      'Administrative, physical, and technical safeguards mapped into defensible operations with BAA-aware sub-processor tracking.',
  },
  {
    name: 'PCI DSS',
    notes:
      'Payment security requirements (v4.0) mapped to control tasks, network segmentation evidence, and quarterly attestation workflows.',
  },
  {
    name: 'NIST',
    notes:
      'CSF 2.0 functions mapped to control coverage; 800-53 baseline crosswalk for federal-adjacent buyers.',
  },
  {
    name: 'CIS',
    notes:
      'Implementation Group 1/2/3 baseline hardening mapped to operational control coverage and evidence cadence.',
  },
  {
    name: 'NDIS Practice Standards',
    notes:
      'All eight Practice Standards modules, SIRS notifications, and unannounced audit prep workflows for registered NDIS providers.',
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
      <div className="relative isolate overflow-hidden">
        <SectionMedia src="/marketing-media/frameworks.jpg" objectPosition="50% 35%" opacity={0.85} scrim="center" />
      <ImmersiveHero
        theme="frameworks"
        visualContent={<FrameworksHeroVisual />}
        badge={{ icon: <Layers className="h-4 w-4" />, text: 'Framework Coverage' }}
        headline="Framework-mapped controls, built for execution"
        subheadline="FormaOS ships framework packs that map obligations into controls and evidence workflows. This is alignment and operational mapping, not a certification claim."
        primaryCta={{
          href: compliancePlanHref('frameworks_hero'),
          label: PUBLIC_CTA_LABELS.compliancePlan,
        }}
        secondaryCta={{
          href: securityReviewHref('frameworks_hero'),
          label: PUBLIC_CTA_LABELS.securityReview,
        }}
      />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Principles */}
      <DeferredSection minHeight={280}>
        <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionChoreography pattern="depth-reveal" className="grid gap-4 lg:grid-cols-3">
            {principles.map((p) => (
              <motion.article
                key={p.title}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.05] p-2">
                  <p.icon className="h-5 w-5 text-slate-200" />
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Cross-mapping explainer — SSR'd, no DeferredSection gating */}
      <section
        aria-labelledby="frameworks-cross-mapping"
        className="relative mx-auto max-w-5xl px-4 pb-14 sm:px-6 lg:px-8"
      >
        <h2
          id="frameworks-cross-mapping"
          className="text-3xl sm:text-4xl font-bold text-white"
        >
          One control surface, many frameworks
        </h2>
        <p className="mt-4 text-slate-300 leading-relaxed">
          Most regulated organisations are accountable to more than one
          framework. A healthcare provider runs NSQHS plus AHPRA registration
          plus, in many cases, ISO 27001 for their tech stack. A fintech
          carries an AFS licence and an APRA prudential standard and a SOC 2
          for their banking partners. Each framework asks for the same kinds
          of evidence — risk decisions, control execution, incident records,
          training attestations — described in different language.
        </p>
        <p className="mt-4 text-slate-300 leading-relaxed">
          FormaOS maps frameworks once. A single piece of evidence — a signed
          policy acknowledgement, an access review export, a vendor
          assessment — satisfies the relevant clauses across every framework
          your organisation is bound to. When a regulator updates a standard,
          the mapping updates centrally and the work items in flight inherit
          the change.
        </p>

        <h3 className="mt-10 text-xl font-semibold text-white">
          How the mapping is built
        </h3>
        <ul className="mt-4 space-y-3 text-slate-300 leading-relaxed">
          <li className="pl-5 relative">
            <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <strong className="text-white">Obligation library.</strong>{' '}
            Each framework is decomposed into atomic obligations — not the
            top-level clause numbers, the specific operational requirements
            underneath them. ISO 27001 alone produces around 120 atomic
            obligations once Annex A is unpacked.
          </li>
          <li className="pl-5 relative">
            <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <strong className="text-white">Control catalogue.</strong>{' '}
            Each obligation maps to one or more FormaOS controls. Controls
            are tangible: a workflow, an access review, a policy approval
            cycle, an evidence requirement.
          </li>
          <li className="pl-5 relative">
            <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <strong className="text-white">Evidence inheritance.</strong>{' '}
            Evidence collected against a control automatically satisfies
            every framework obligation that maps to it. A single quarterly
            access review can land in your SOC 2, ISO 27001, and HIPAA
            evidence bundles without manual duplication.
          </li>
          <li className="pl-5 relative">
            <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <strong className="text-white">Coverage telemetry.</strong>{' '}
            Each framework displays a live readiness score derived from
            evidence freshness, control owner activity, and outstanding
            findings. Buyers can see the gaps before the auditor does.
          </li>
        </ul>

        <h3 className="mt-10 text-xl font-semibold text-white">
          What &quot;mapped&quot; means here
        </h3>
        <p className="mt-4 text-slate-300 leading-relaxed">
          FormaOS does not certify your organisation. Certification is
          performed by accredited assessors against a documented control
          environment. What FormaOS does is make the control environment
          continuously defensible: every control has a named owner, every
          obligation has a path to evidence, every audit window opens with a
          ready-to-export bundle rather than a six-week scramble. Most
          customers see audit prep collapse from weeks to days within the
          first cycle on platform.
        </p>
        <p className="mt-4 text-slate-300 leading-relaxed">
          If you need a specific framework that is not listed in the pack
          set above — APRA CPS 234, the AESCSF, the Essential Eight at
          Maturity Level 2 — the obligation library is extensible.{' '}
          <Link
            href="/contact?type=compliance-plan"
            className="text-white underline-offset-4 hover:underline"
          >
            Talk to our team
          </Link>{' '}
          about your framework set during the compliance plan walkthrough.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Framework Packs */}
      <DeferredSection minHeight={400}>
        <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <SectionMedia src="/marketing-media/enterprise.jpg" objectPosition="50% 40%" opacity={0.6} scrim="center" />
          <ScrollReveal variant="depthScale" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-sm p-7 lg:p-10">
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
                      <div className="mt-0.5 inline-flex rounded-lg border border-white/10 bg-white/[0.05] p-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-200" />
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
