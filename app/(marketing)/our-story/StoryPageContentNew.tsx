'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Target,
  Shield,
  Zap,
  CheckCircle,
  Quote,
  Lightbulb,
  Building2,
  Users,
  FileCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';
import dynamic from 'next/dynamic';
import { VisualDivider } from '@/components/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { DeferredSection } from '../components/shared';
import { brand } from '@/config/brand';
import { OurStoryHeroVisual } from './components/OurStoryHeroVisual';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false },
);

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================================================
// OUR STORY PAGE - DESIGN SYNCED WITH HOME/PRODUCT VISUAL SYSTEM
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
        icon: <Sparkles className="w-4 h-4" />,
        text: 'Our Story',
        colorClass: 'indigo',
      }}
      headline={
        <>
          Built for Organizations Where
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Compliance Is Mission-Critical
          </span>
        </>
      }
      subheadline="FormaOS was built for high-stakes sectors where governance must withstand audits, incidents, and real-world scrutiny."
      primaryCta={{
        href: `${appBase}/auth/signup`,
        label: 'Start Free Trial',
      }}
      secondaryCta={{
        href: '/contact',
        label: 'Request a Demo',
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// Founder Quote Section (Hero-Level Visual Moment)
// ----------------------------------------------------------------------------
function FounderQuote() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-pink-500/20 via-violet-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="relative"
        >
          {/* Glassmorphism Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-3xl" />

            {/* Quote Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: duration.slow }}
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-8"
            >
              <Quote className="w-10 h-10 text-indigo-400" />
            </motion.div>

            {/* Quote Text */}
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: duration.slower }}
              className="relative text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-8"
            >
              We didn&apos;t build FormaOS to manage compliance.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                We built it to make accountability unavoidable.
              </span>
            </motion.blockquote>

            {/* Gradient divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: duration.slower }}
              className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mx-auto rounded-full mb-8"
            />

            {/* Attribution */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: duration.slow }}
              className="relative text-gray-400"
            >
              <span className="font-semibold text-white">Ejaz Hussain</span>
              <span className="mx-3 text-indigo-500">•</span>
              <span>Founder & Chief Engineer, FormaOS</span>
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
    'Manual workarounds',
    'Fragmented ownership',
    'Inconsistent controls',
    'High audit stress',
    'Compliance that exists on paper, not in practice',
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-red-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Target className="h-3 w-3 text-red-400" />
            <span className="text-gray-300">The Challenge</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            The Compliance Industry Solved Storage.
            <br />
            <span className="text-gray-500">Not Execution.</span>
          </h2>
        </motion.div>

        {/* Content Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10 mb-10"
        >
          <div className="space-y-6">
            <p className="text-lg text-gray-400 leading-relaxed">
              Most compliance platforms focus on documentation: policies in
              folders, evidence in files, reports at audit time. But real
              compliance does not live in documents. It lives in decisions,
              workflows, handovers, approvals, and accountability.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Organizations were being asked to prove compliance after the fact,
              instead of being supported to operate compliantly by design.
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
          <p className="text-xl text-white font-semibold mb-6">The result?</p>
          <SectionChoreography pattern="stagger-wave" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map((problem, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-gray-300">{problem}</span>
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
          className="text-xl text-indigo-400 font-medium"
        >
          We believed there had to be a better way.
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-purple-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Lightbulb className="h-3 w-3 text-indigo-400" />
            <span className="text-gray-300">Our Approach</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            From Policy to Proof
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Built Into Operations
            </span>
          </h2>
        </motion.div>

        {/* Principle Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/20 via-white/[0.08] to-white/[0.04] rounded-3xl border border-indigo-500/30 p-8 lg:p-10 mb-12"
        >
          <p className="text-lg text-gray-400 mb-4">
            FormaOS is not a document system. It is an operational compliance
            operating system.
          </p>
          <p className="text-xl text-white font-medium mb-4">
            We designed FormaOS around one principle:
          </p>
          <p className="text-2xl sm:text-3xl text-indigo-400 font-bold italic leading-tight">
            &ldquo;Compliance should be embedded into how work is done, not
            verified after it is done.&rdquo;
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
            With FormaOS, organizations:
          </p>
          <SectionChoreography pattern="cascade" className="space-y-4">
            {capabilities.map((capability, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <capability.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-lg text-gray-300">{capability.text}</span>
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
          <DemoComplianceChain glowColor="from-indigo-500/15 to-purple-500/15" />
        </motion.div>

        {/* Closing */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.8 }}
          className="text-xl text-gray-400"
        >
          Compliance becomes part of the{' '}
          <span className="text-white font-medium">operating fabric</span> of
          the organization.
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/3 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-violet-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Shield className="h-3 w-3 text-violet-400" />
            <span className="text-gray-300">Our Purpose</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Designed by Engineers.
            <br />
            <span className="text-gray-500">Built for Accountability.</span>
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10"
        >
          <div className="space-y-6">
            <p className="text-lg text-gray-400 leading-relaxed">
              FormaOS was built by engineers who understand that systems shape
              outcomes. If accountability is not designed into a system, it
              cannot be enforced at scale.
            </p>

            <p className="text-xl text-white font-medium">
              We built FormaOS to answer one fundamental question:
            </p>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/30">
              <p className="text-2xl text-violet-300 font-semibold italic leading-tight">
                &ldquo;Can an organization prove, at any moment, that it is
                operating in line with its obligations?&rdquo;
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-lg text-gray-500">Not at audit time.</p>
              <p className="text-lg text-gray-500">Not through spreadsheets.</p>
              <p className="text-lg text-gray-500">
                Not through manual reconciliation.
              </p>
              <p className="text-xl text-white font-medium pt-4">
                But through{' '}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  live operational evidence
                </span>
                .
              </p>
            </div>
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-indigo-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute top-1/3 -right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-purple-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="h-3 w-3 text-pink-400" />
            <span className="text-gray-300">What Sets Us Apart</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            An Operating System for Compliance,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Not a Tool
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl">
            FormaOS is purpose-built for regulated environments that demand
            precision, traceability, and trust.
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
          <p className="text-lg text-white font-medium mb-8">Key principles:</p>
          <SectionChoreography pattern="alternating" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle) => (
              <motion.div
                key={principle.title}
                whileHover={{ y: -8, transition: { duration: duration.fast } }}
                className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all duration-500"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <principle.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-gray-400">{principle.description}</p>
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
          <p className="text-gray-500">This is not about passing audits.</p>
          <p className="text-white font-medium">
            This is about building organizations that can{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              stand behind every decision they make
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
    'Reduce compliance friction',
    'Strengthen accountability',
    'Protect stakeholders',
    'Make governance measurable, transparent, and defensible',
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Target className="h-3 w-3 text-cyan-400" />
            <span className="text-gray-300">Our Mission</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Operational Certainty
            <br />
            <span className="text-gray-500">for Regulated Organizations</span>
          </h2>
        </motion.div>

        {/* Mission Statement Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-white/[0.08] to-white/[0.04] rounded-3xl border border-cyan-500/30 p-8 lg:p-10 mb-12 text-center"
        >
          <p className="text-xl text-white font-medium mb-4">
            Our mission is simple:
          </p>

          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            To transform regulatory obligation into operational certainty.
          </p>
        </motion.div>

        {/* Beliefs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow, delay: 0.2 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10 mb-12"
        >
          <p className="text-lg text-gray-400 mb-6">
            We believe every organization operating in regulated environments
            deserves systems that:
          </p>
          <SectionChoreography pattern="stagger-wave" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beliefs.map((belief, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
              >
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span className="text-gray-300">{belief}</span>
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
          <p className="text-lg text-gray-400">
            FormaOS exists to give organizations something they&apos;ve never
            truly had before:
          </p>

          <p className="text-2xl text-white font-semibold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Provable compliance
            </span>{' '}
            built into daily operations.
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-pink-500/20 via-violet-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="relative"
        >
          {/* Executive Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: duration.slow }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-indigo-400"
                >
                  <Building2 className="h-3 w-3" />
                  Join Us
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: duration.slower }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
                >
                  <span className="text-white">Build Compliance Into</span>
                  <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    How Your Organization Operates
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: duration.slower }}
                  className="w-24 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mx-auto rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="text-center mb-10">
                <p className="text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
                  FormaOS is trusted by organizations that cannot afford
                  ambiguity, inconsistency, or after-the-fact compliance.
                </p>

                <p className="text-xl text-white font-medium max-w-2xl mx-auto">
                  If your organization needs more than documents. If it needs
                  execution, ownership, and proof, you are in the right place.
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
                  href={`${appBase}/auth/signup`}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <Link
                  href="/contact"
                  className="group flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  Request a Demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>

              <div className="text-center mt-8 text-sm text-gray-500">
                14-day free trial • No credit card required • Cancel anytime
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
      <VisualDivider gradient />
      <DeferredSection minHeight={400}>
        <TheProblem />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={500}>
        <TheApproach />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={400}>
        <WhyWeBuiltIt />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={600}>
        <WhatMakesUsDifferent />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={400}>
        <OurMission />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={300}>
        <FinalCTA />
      </DeferredSection>
    </div>
  );
}
