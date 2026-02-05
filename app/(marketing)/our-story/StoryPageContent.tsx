'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================================================
// HERO SECTION
// ============================================================================

export function StoryHero() {
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1 opacity-40">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-8 backdrop-blur-sm"
            >
              <span className="text-sm text-indigo-400 font-medium tracking-wide">
                Our Story
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Built for Organizations Where
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Compliance Is Mission-Critical
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto text-center leading-relaxed"
            >
              FormaOS was created for teams that operate in environments where
              failure is not an option. Healthcare, disability services,
              finance, education, and government don&apos;t just need software,
              they need systems that can withstand scrutiny, audits, and
              real-world consequences.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href={`${appBase}/auth/signup`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// FOUNDER QUOTE SECTION
// ============================================================================

function FounderQuote() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Quote Mark */}
          <div className="text-6xl text-indigo-500/30 mb-6">&ldquo;</div>

          {/* Quote Text */}
          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-8">
            We didn&apos;t build FormaOS to manage compliance.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              We built it to make accountability unavoidable.
            </span>
          </blockquote>

          {/* Attribution */}
          <div className="text-gray-400">
            <span className="font-medium text-white">Ejaz Hussain</span>
            <span className="mx-2">•</span>
            <span>Founder & Chief Engineer, FormaOS</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// THE PROBLEM SECTION
// ============================================================================

function TheProblem() {
  const problems = [
    'Manual workarounds',
    'Fragmented ownership',
    'Inconsistent controls',
    'High audit stress',
    'Compliance that exists on paper, not in practice',
  ];

  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            The Compliance Industry Solved Storage.
            <br />
            <span className="text-gray-500">Not Execution.</span>
          </h2>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6 mb-12"
        >
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            Most compliance platforms focus on documentation: policies in
            folders, evidence in files, reports at audit time. But real
            compliance does not live in documents. It lives in decisions,
            workflows, handovers, approvals, and accountability.
          </p>
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            Organizations were being asked to prove compliance after the fact,
            instead of being supported to operate compliantly by design.
          </p>
        </motion.div>

        {/* The Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-xl text-white font-semibold mb-6">The result?</p>
          <ul className="space-y-4">
            {problems.map((problem, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-4 text-lg text-gray-300"
              >
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                {problem}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Closing */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-xl text-indigo-400 font-medium"
        >
          We believed there had to be a better way.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================================================
// THE FORMAOS APPROACH
// ============================================================================

function TheApproach() {
  const capabilities = [
    'Model regulatory frameworks directly into structured controls',
    'Assign ownership at every layer',
    'Turn obligations into executable workflows',
    'Track every action with immutable audit logs',
    'Generate evidence automatically as work happens',
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            From Policy to Proof
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Built Into Operations
            </span>
          </h2>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6 mb-12"
        >
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            FormaOS is not a document system. It is an operational compliance
            operating system.
          </p>
          <p className="text-xl text-white font-medium">
            We designed FormaOS around one principle:
          </p>
          <p className="text-2xl text-indigo-400 font-semibold italic">
            Compliance should be embedded into how work is done, not verified
            after it is done.
          </p>
        </motion.div>

        {/* Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-lg text-white font-medium mb-6">
            With FormaOS, organizations:
          </p>
          <ul className="space-y-4">
            {capabilities.map((capability, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="flex items-start gap-4 text-lg text-gray-300"
              >
                <span className="w-2 h-2 mt-2.5 rounded-full bg-indigo-500" />
                {capability}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Closing */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-xl text-gray-400"
        >
          Compliance becomes part of the operating fabric of the organization.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================================================
// WHY WE BUILT IT
// ============================================================================

function WhyWeBuiltIt() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Designed by Engineers.
            <br />
            <span className="text-gray-500">Built for Accountability.</span>
          </h2>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            FormaOS was built by engineers who understand that systems shape
            outcomes. If accountability is not designed into a system, it cannot
            be enforced at scale.
          </p>

          <p className="text-xl text-white font-medium">
            We built FormaOS to answer one fundamental question:
          </p>

          <p className="text-2xl text-indigo-400 font-semibold italic">
            &ldquo;Can an organization prove, at any moment, that it is
            operating in line with its obligations?&rdquo;
          </p>

          <div className="pt-8 space-y-3">
            <p className="text-lg text-gray-500">Not at audit time.</p>
            <p className="text-lg text-gray-500">Not through spreadsheets.</p>
            <p className="text-lg text-gray-500">
              Not through manual reconciliation.
            </p>
            <p className="text-xl text-white font-medium pt-4">
              But through live operational evidence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// WHAT MAKES US DIFFERENT
// ============================================================================

function WhatMakesUsDifferent() {
  const principles = [
    {
      title: 'Governance by design',
      description: 'compliance is embedded into workflows',
    },
    {
      title: 'Evidence by default',
      description: 'actions generate audit-ready records automatically',
    },
    {
      title: 'Ownership at every level',
      description: 'accountability is visible, measurable, and enforceable',
    },
    {
      title: 'Real-time verification',
      description:
        'controls are continuously validated, not reviewed once a year',
    },
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
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

        {/* Key Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <p className="text-lg text-white font-medium mb-8">Key principles:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle, idx) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {principle.title}
                </h3>
                <p className="text-gray-400">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-3 text-lg"
        >
          <p className="text-gray-500">This is not about passing audits.</p>
          <p className="text-white font-medium">
            This is about building organizations that can stand behind every
            decision they make.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// OUR MISSION
// ============================================================================

function OurMission() {
  const beliefs = [
    'Reduce compliance friction',
    'Strengthen accountability',
    'Protect stakeholders',
    'Make governance measurable, transparent, and defensible',
  ];

  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Operational Certainty
            <br />
            <span className="text-gray-500">for Regulated Organizations</span>
          </h2>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-8"
        >
          <p className="text-xl text-white font-medium">
            Our mission is simple:
          </p>

          <p className="text-2xl sm:text-3xl text-indigo-400 font-bold">
            To transform regulatory obligation into operational certainty.
          </p>

          <div className="pt-8">
            <p className="text-lg text-gray-400 mb-6">
              We believe every organization operating in regulated environments
              deserves systems that:
            </p>
            <ul className="space-y-4">
              {beliefs.map((belief, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-4 text-lg text-gray-300"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {belief}
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="text-lg text-gray-400 pt-8">
            FormaOS exists to give organizations something they&apos;ve never
            truly had before:
          </p>

          <p className="text-2xl text-white font-semibold">
            Provable compliance, built into daily operations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA
// ============================================================================

function FinalCTA() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Build Compliance Into
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              How Your Organization Operates
            </span>
          </h2>

          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            FormaOS is trusted by organizations that cannot afford ambiguity,
            inconsistency, or after-the-fact compliance.
          </p>

          <p className="text-xl text-white font-medium mb-12 max-w-2xl mx-auto">
            If your organization needs more than documents. If it needs
            execution, ownership, and proof, you are in the right place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`${appBase}/auth/signup`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
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
    <div className="relative">
      <FounderQuote />
      <VisualDivider />
      <TheProblem />
      <VisualDivider />
      <TheApproach />
      <VisualDivider />
      <WhyWeBuiltIt />
      <VisualDivider />
      <WhatMakesUsDifferent />
      <VisualDivider />
      <OurMission />
      <VisualDivider />
      <FinalCTA />
    </div>
  );
}
