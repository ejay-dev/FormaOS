'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  Quote,
  Users,
  FileCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';
import dynamic from 'next/dynamic';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import { DeferredSection } from '../components/shared';
import { OurStoryHeroVisual } from './components/OurStoryHeroVisual';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false },
);

// ============================================================================
// OUR STORY PAGE, DESIGN SYNCED WITH HOME/PRODUCT VISUAL SYSTEM
// ============================================================================

// ----------------------------------------------------------------------------
// Story Hero Section
// ----------------------------------------------------------------------------
export function StoryHero() {
  return (
    <ImmersiveHero
      theme="our-story"
      visualContent={<OurStoryHeroVisual />}
      badge={{
        text: 'Our Story',
        colorClass: 'slate',
      }}
      headline={
        <>
          I have been building
          <br />
          <span className="text-foreground">this one thing since 2022</span>
        </>
      }
      subheadline="FormaOS is my first project in compliance infrastructure. I write it from Adelaide, around freelance work, for the teams Australian regulators hold to account."
      primaryCta={{
        href: compliancePlanHref('our_story_hero'),
        label: PUBLIC_CTA_LABELS.compliancePlan,
      }}
      secondaryCta={{
        href: demoHref('our_story_hero'),
        label: PUBLIC_CTA_LABELS.bookDemo,
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// Founder Quote Section (Hero-Level Visual Moment)
// ----------------------------------------------------------------------------
function FounderQuote() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative isolate z-10 max-w-5xl mx-auto px-6 lg:px-12 overflow-hidden">
        <SectionMedia
          src="/marketing-media/our-story.jpg"
          objectPosition="50% 35%"
          opacity={0.62}
          scrim="center"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="relative"
        >
          {/* Quote panel, solid scrim over the section photo */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/65 shadow-2xl p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Quote Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: duration.slow }}
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-white/10 bg-white/[0.05] mb-8"
            >
              <Quote className="w-10 h-10 text-slate-300" />
            </motion.div>

            {/* Quote Text */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: duration.slower }}
              className="relative text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-8"
            >
              The audit log signs itself.
              <br />
              <span className="text-foreground">
                FormaOS anchors it daily to a public transparency tree so a
                regulator can verify any event without trusting me.
              </span>
            </motion.blockquote>

            {/* Hairline divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: duration.slower }}
              className="w-32 h-px bg-white/20 mx-auto rounded-full mb-8"
            />

            {/* Attribution with founder avatar.
                Image file at /public/team/founder.jpeg, page renders
                cleanly with initials fallback even if the binary isn't
                uploaded yet. */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: duration.slow }}
              className="relative flex flex-col items-center gap-4 text-slate-400 sm:flex-row sm:justify-center"
            >
              {/* Avatar: source is a 1:2 portrait (499×1023). Earlier
                  attempts used `scale-[1.5] origin-[50%_20%]` to zoom
                  the face into a 64px circle, but the scale push
                  cropped the right half of the face whenever the
                  subject sat slightly off-centre in the source. New
                  approach: larger 80px circle, no transform, just
                  `object-cover` with `object-position` tuned to anchor
                  the visible window around the upper portion of the
                  portrait so the face lands centred without scaling. */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/[0.1]">
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center bg-white/[0.05] text-base font-semibold text-white/50"
                >
                  EH
                </div>
                <img
                  src="/team/founder.jpeg"
                  alt="Portrait of Ejaz Hussain, founder of FormaOS"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="relative h-full w-full object-cover object-[50%_18%]"
                />
              </div>
              <div>
                <span className="font-semibold text-white">Ejaz Hussain</span>
                <span className="mx-3 text-zinc-700">•</span>
                <span>Founder &amp; Chief Engineer, FormaOS</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// The Problem Section
// ----------------------------------------------------------------------------
function TheProblem() {
  const problems = [
    'Evidence reconstructed hours before audits',
    'Fragmented ownership, nobody knows who owns what',
    'Controls documented but never enforced',
    'Framework coverage gaps discovered at audit time',
    'No single source of truth for regulators',
    'Leadership liability with no defensible paper trail',
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header, labelled hairline rule */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
            Every tool I looked at stored the documents.
            <br />
            <span className="text-slate-500">None of them ran the work.</span>
          </h2>
        </motion.div>

        {/* Content Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:p-10 mb-10"
        >
          <div className="space-y-6">
            <p className="text-lg text-slate-400 leading-relaxed">
              I started by reading the actual instruments: the NDIS Practice
              Standards, the Aged Care Quality Standards, ISO 27001 Annex A, the
              SOC 2 trust services criteria. Then I looked at the software that
              says it covers them. Almost all of it is a document library with a
              workflow tab bolted on.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              The obligations are not really about documents. They are about who
              did the thing, when, whether that person was still credentialed at
              the time, and whether anyone can show it six months later.
            </p>
          </div>
        </motion.div>

        {/* The Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.2 }}
          className="mb-10"
        >
          <p className="text-xl text-white font-semibold mb-6">
            What that leaves behind:
          </p>
          <SectionChoreography
            pattern="stagger-wave"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {problems.map((problem, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/10"
              >
                <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                <span className="text-slate-300">{problem}</span>
              </div>
            ))}
          </SectionChoreography>
        </motion.div>

        {/* Closing */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.8 }}
          className="text-xl text-zinc-400 font-medium"
        >
          None of that is a documentation problem. It is a missing execution
          layer, and I could not find anyone building one.
        </motion.p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// The FormaOS Approach Section
// ----------------------------------------------------------------------------
function TheApproach() {
  const capabilities = [
    {
      text: 'Model regulatory frameworks directly into structured controls',
      icon: FileCheck,
    },
    { text: 'Assign ownership at every layer', icon: Users },
    { text: 'Turn obligations into executable workflows', icon: Zap },
    { text: 'Track every action with immutable audit logs', icon: Shield },
    {
      text: 'Generate evidence automatically as work happens',
      icon: CheckCircle,
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header, centered plain label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
            What I built instead
          </h2>
        </motion.div>

        {/* Principle Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:p-10 mb-12"
        >
          <p className="text-lg text-slate-400 mb-4">
            FormaOS stores documents too. The difference is that a document is
            the end of a chain, not the product.
          </p>
          <p className="text-xl text-white font-medium mb-4">
            I built it around one rule:
          </p>
          <p className="text-2xl sm:text-3xl text-slate-300 font-bold italic leading-tight">
            &ldquo;Compliance should be embedded in how the work is done, not
            reconstructed after it is done.&rdquo;
          </p>
        </motion.div>

        {/* Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-lg text-white font-medium mb-6">
            In practice, an organisation can:
          </p>
          <SectionChoreography pattern="cascade" className="space-y-4">
            {capabilities.map((capability, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center">
                  <capability.icon className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-lg text-slate-300">
                  {capability.text}
                </span>
              </div>
            ))}
          </SectionChoreography>
        </motion.div>

        {/* Live compliance chain demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.6 }}
          className="mb-12 max-w-2xl mx-auto"
        >
          <DemoComplianceChain glowColor="from-zinc-700/15 to-zinc-500/15" />
        </motion.div>

        {/* Closing */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.8 }}
          className="text-xl text-slate-400"
        >
          The evidence becomes{' '}
          <span className="text-white font-medium">
            a by-product of the work
          </span>
          , instead of a project that starts when the auditor books a date.
        </motion.p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Why We Built It Section
// ----------------------------------------------------------------------------
function WhyWeBuiltIt() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header, labelled hairline rule */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
            I am not a compliance consultant.
            <br />
            <span className="text-slate-500">That turned out to matter.</span>
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:p-10"
        >
          <div className="space-y-6">
            <p className="text-lg text-slate-400 leading-relaxed">
              I read a standard the way I read a spec: what triggers this, what
              is the deadline, who is accountable, what proves it happened. Most
              clauses turn out to be a state machine with a due date attached,
              which is a thing software is good at.
            </p>

            <p className="text-xl text-white font-medium">
              So the whole product answers one question:
            </p>

            <div className="p-6 rounded-2xl bg-white/[0.05] border border-white/10">
              <p className="text-2xl text-slate-200 font-semibold italic leading-tight">
                &ldquo;Can an organisation prove, at any moment, that it is
                operating in line with its obligations?&rdquo;
              </p>
            </div>

            <p className="text-lg text-slate-400 leading-relaxed">
              That answer has to hold on an ordinary Tuesday, not only in the
              week before an audit. It is why the audit log is hash-chained in
              Postgres with append-only enforced by a database trigger and RLS
              deny policies rather than application code, and why the chain head
              is anchored daily to Sigstore Rekor. A regulator can verify an
              event without taking my word for it.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// What Makes Us Different Section
// ----------------------------------------------------------------------------
function WhatMakesUsDifferent() {
  const principles = [
    {
      title: 'Governance by design',
      description: 'Compliance is embedded into workflows',
      icon: Shield,
    },
    {
      title: 'Evidence by default',
      description: 'Actions generate audit-ready records automatically',
      icon: FileCheck,
    },
    {
      title: 'Ownership at every level',
      description: 'Accountability is visible, measurable, and enforceable',
      icon: Users,
    },
    {
      title: 'Real-time verification',
      description:
        'Controls are continuously validated, not reviewed once a year',
      icon: Zap,
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header, centered plain label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
            The four decisions everything else follows from
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            None of these are settings. They sit in the schema, which is the
            reason they are hard to switch off when a deadline gets tight.
          </p>
        </motion.div>

        {/* Key Principles Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="mb-12"
        >
          <SectionChoreography
            pattern="alternating"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {principles.map((principle) => (
              <motion.div
                key={principle.title}
                whileHover={{ y: -8, transition: { duration: duration.fast } }}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-white/20 transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center">
                    <principle.icon className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-slate-400">{principle.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </SectionChoreography>
        </motion.div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.6 }}
          className="space-y-3 text-lg"
        >
          <p className="text-white font-medium">
            Passing the audit is the easy consequence. The harder one is
            answering a question about last March{' '}
            <span className="text-foreground">
              without three people digging through a shared drive
            </span>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Our Mission Section
// ----------------------------------------------------------------------------
function OurMission() {
  const beliefs = [
    'Cut the manual work of proving compliance',
    'Give every obligation a named owner',
    'Make the evidence verifiable by an outsider',
    'Show the current position without a reporting exercise',
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header, centered plain label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
            What I am building towards
          </h2>
        </motion.div>

        {/* Mission Statement Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 lg:p-10 mb-12 text-center"
        >
          <p className="text-xl text-white font-medium mb-4">
            The goal has not changed since the first commit:
          </p>

          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Turn a regulatory obligation into work that gets done, and evidence
            that survives review.
          </p>
        </motion.div>

        {/* Beliefs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:p-10 mb-12"
        >
          <p className="text-lg text-slate-400 mb-6">
            A system that does this properly should:
          </p>
          <SectionChoreography
            pattern="stagger-wave"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {beliefs.map((belief, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/10"
              >
                <CheckCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <span className="text-slate-300">{belief}</span>
              </div>
            ))}
          </SectionChoreography>
        </motion.div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-lg text-slate-400">
            FormaOS is bootstrapped, sole-engineered and AU-hosted. The roadmap
            is short on purpose.
          </p>

          <p className="text-2xl text-white font-semibold">
            If a feature does not make an obligation{' '}
            <span className="text-foreground">
              easier to run and easier to prove
            </span>
            , it does not get built.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Final CTA Section
// ----------------------------------------------------------------------------
function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0f1c]">
      <div className="relative isolate z-10 max-w-7xl mx-auto px-6 lg:px-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="relative"
        >
          {/* Executive Panel, solid scrim over the section photo */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/65 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: duration.slower }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
                >
                  <span className="text-white">See whether it fits</span>
                  <br className="hidden sm:inline" />
                  <span className="text-foreground">
                    how your team already works
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: duration.slower }}
                  className="w-24 h-px bg-white/20 mx-auto rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="text-center mb-10">
                <p className="text-lg text-slate-400 mb-6 max-w-2xl mx-auto">
                  There are no customer logos on this page yet. What I can do is
                  walk you through the product against your own obligations and
                  let you judge it from there.
                </p>

                <p className="text-xl text-white font-medium max-w-2xl mx-auto">
                  If your evidence currently lives in a shared drive and a
                  spreadsheet, that is the gap this was written for.
                </p>
              </div>

              {/* CTA Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: duration.slower }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href={compliancePlanHref('our_story_final')}
                  className="group relative overflow-hidden rounded-2xl bg-foreground text-background px-8 py-4 text-base font-semibold shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {PUBLIC_CTA_LABELS.compliancePlan}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
                <Link
                  href={demoHref('our_story_final')}
                  className="group flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  {PUBLIC_CTA_LABELS.bookDemo}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>

              <div className="text-center mt-8 text-sm text-slate-500">
                Guided compliance plan • Assessment-led onboarding •
                Procurement-ready review
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export function StoryContent() {
  return (
    <div className="min-h-screen text-white overflow-hidden">
      <FounderQuote />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={400}>
        <TheProblem />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={500}>
        <TheApproach />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={400}>
        <WhyWeBuiltIt />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={420}>
        <WhatMakesUsDifferent />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={400}>
        <OurMission />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={300}>
        <FinalCTA />
      </DeferredSection>
    </div>
  );
}
