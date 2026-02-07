'use client';

import Link from 'next/link';
import {
  Database,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  GitBranch,
  Layers,
  Globe,
  Building2,
  Eye,
  AlertTriangle,
  Zap,
  Settings,
  UserCheck,
  BarChart3,
  FileCheck,
  Activity,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================
// HERO COMPONENT
// ============================================

function ProductHero() {
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
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
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
            'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Compliance Operating System
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              The Compliance OS
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                for Real Organizations
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
            >
              FormaOS is not a document manager. It is a purpose-built operating
              system that transforms regulatory obligations into structured
              controls, owned actions, live evidence, and audit-ready outcomes.
            </motion.p>

            {/* Key Differentiator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-4">
                Where traditional tools store files, FormaOS runs compliance
                across your organization in real time.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Structured Controls
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Owned Actions
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Live Evidence
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
              >
                <span>Request Demo</span>
              </motion.a>
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
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================
// WHAT IS FORMAOS SECTION
// ============================================

function WhatIsFormaOS() {
  const unifies = [
    { icon: Building2, label: 'Governance structure' },
    { icon: FileCheck, label: 'Policy and control execution' },
    { icon: Database, label: 'Evidence generation' },
    { icon: AlertTriangle, label: 'Risk visibility' },
    { icon: Shield, label: 'Audit defense' },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            What Is FormaOS?
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            An End-to-End
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}
              Compliance Operating System
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
            Designed for regulated teams that need certainty, accountability,
            and defensible audit outcomes.
          </p>
        </motion.div>

        {/* What it unifies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12"
        >
          <h3 className="text-xl font-semibold text-white text-center mb-8">
            FormaOS unifies:
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {unifies.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-sm text-gray-400">{item.label}</span>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm">
            …into a single, continuously operating system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No silos
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No manual reconciliation
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No last-minute audit panic
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// OBLIGATION TO EXECUTION SECTION
// ============================================

function ObligationToExecution() {
  const flow = [
    {
      step: 'Obligations',
      becomes: 'structured controls',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      step: 'Controls',
      becomes: 'owned tasks',
      color: 'from-blue-500 to-purple-500',
    },
    {
      step: 'Tasks',
      becomes: 'live evidence',
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: 'Evidence',
      becomes: 'complete audit trail',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            From Obligation to Execution
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            You Don't Just Record
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              {' '}
              Compliance. You Run It.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Most compliance platforms stop at documentation. FormaOS goes
            further. It operationalizes compliance across your organization.
          </p>
        </motion.div>

        {/* Flow visualization */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flow.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
                <div
                  className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-semibold mb-4`}
                >
                  {item.step}
                </div>
                <p className="text-gray-400">
                  become{' '}
                  <span className="text-white font-medium">{item.becomes}</span>
                </p>
              </div>
              {index < flow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Key outcomes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 grid sm:grid-cols-3 gap-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4 text-cyan-400" />
            Every action is tracked
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <UserCheck className="w-4 h-4 text-blue-400" />
            Every control has an owner
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Every outcome is provable
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// OPERATING MODEL SECTION
// ============================================

function OperatingModel() {
  const models = [
    {
      number: '1',
      title: 'Structure',
      subtitle: 'Model your organization with governance built in',
      description:
        'Model your organization, teams, sites, and responsibilities with clarity and governance built in.',
      features: [
        'Organizational hierarchy and role mapping',
        'Framework-aligned policy and control architecture',
        'Clear accountability for every obligation',
        'Evidence chains mapped to controls',
      ],
      outcome:
        'Your compliance foundation becomes structured, governed, and audit-ready by design.',
      color: 'from-cyan-500 to-blue-500',
      icon: Building2,
    },
    {
      number: '2',
      title: 'Operationalize',
      subtitle: 'Turn requirements into real execution',
      description:
        'Turn requirements into real, trackable execution across teams.',
      features: [
        '8 workflow triggers: evidence expiry, control failures, task overdue, cert expiring, etc.',
        'Conditional task generation with priority, owners, and due dates',
        'Auto-escalation rules for critical issues',
        'Notification routing and audit trail logging',
      ],
      outcome:
        'Compliance becomes part of daily operations, not a quarterly scramble.',
      color: 'from-blue-500 to-purple-500',
      icon: Zap,
    },
    {
      number: '3',
      title: 'Validate',
      subtitle: 'Continuously verify controls are working',
      description: 'Continuously verify that controls are working as intended.',
      features: [
        'Real-time compliance monitoring',
        'Automated deviation alerts',
        'Control effectiveness tracking',
        'Live risk and status visibility',
      ],
      outcome:
        "You don't wait for audits to discover issues. You see them as they happen.",
      color: 'from-purple-500 to-pink-500',
      icon: Eye,
    },
    {
      number: '4',
      title: 'Defend',
      subtitle: 'Produce audit-ready evidence instantly',
      description:
        'Produce audit-ready evidence with full traceability and regulatory context.',
      features: [
        'Immutable evidence chains',
        'Time-stamped audit logs',
        'Regulatory reporting packages',
        'Defensible audit trails and documentation',
      ],
      outcome: 'Audits become confirmations, not investigations.',
      color: 'from-pink-500 to-rose-500',
      icon: Shield,
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-cyan-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            The FormaOS Operating Model
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Four Phases.
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}
              Complete Control.
            </span>
          </h2>
        </motion.div>

        {/* Operating Model Cards */}
        <div className="space-y-8">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="group"
              >
                <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden">
                  <div className="grid lg:grid-cols-[300px_1fr] gap-8 p-8 sm:p-10">
                    {/* Left side - Number and Title */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div
                            className={`text-sm font-semibold bg-gradient-to-r ${model.color} bg-clip-text text-transparent`}
                          >
                            Phase {model.number}
                          </div>
                          <h3 className="text-2xl font-bold text-white">
                            {model.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {model.description}
                      </p>
                    </div>

                    {/* Right side - Features and Outcome */}
                    <div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {model.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-400"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${model.color} bg-opacity-10 border border-white/10`}
                      >
                        <p className="text-sm text-white font-medium">
                          {model.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHAT MAKES FORMAOS DIFFERENT
// ============================================

function WhatMakesDifferent() {
  const differentiators = [
    {
      icon: Layers,
      title: 'A True Compliance Operating System',
      description:
        'FormaOS is infrastructure, not a tool. It orchestrates governance, execution, and evidence across your organization.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Building2,
      title: 'Built for Regulated Environments',
      description:
        'Designed specifically for healthcare, NDIS, finance, education, and government-aligned organizations.',
      color: 'from-blue-500 to-purple-500',
    },
    {
      icon: Database,
      title: 'Evidence by Design',
      description:
        'Every action produces verifiable, structured evidence automatically.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: UserCheck,
      title: 'Accountability at Scale',
      description:
        'Every control has a defined owner, status, and outcome. No ambiguity.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Shield,
      title: 'Audit Defense, Not Audit Prep',
      description:
        'You are always audit-ready because your compliance is continuously running.',
      color: 'from-rose-500 to-orange-500',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            What Makes FormaOS Different
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Not Just Another
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
              {' '}
              Compliance Tool
            </span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer backdrop-blur-sm ${index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-5 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// ENTERPRISE SECURITY SECTION
// ============================================

function EnterpriseSecurity() {
  const securityFeatures = [
    { label: 'SOC 2-aligned controls', icon: Shield },
    { label: 'End-to-end encryption', icon: Lock },
    { label: 'Google OAuth + Enterprise SAML', icon: Users },
    { label: 'MFA with TOTP Authenticator', icon: UserCheck },
    { label: 'Immutable Audit Logs', icon: Database },
    { label: 'Role-Based Access Control (6 Roles)', icon: UserCheck },
    { label: 'Automated compliance score engine', icon: Shield },
    { label: 'Correlation ID tracking', icon: Lock },
    { label: 'Session Rotation & Rate Limiting', icon: Database },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              Enterprise-Grade Security
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Built for Regulated Organizations
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Security is embedded at the operating layer, not added as a
              feature.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-gray-300">{feature.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// REAL-TIME COMPLIANCE INTELLIGENCE
// ============================================

function ComplianceIntelligence() {
  const intelligenceFeatures = [
    {
      label: 'Compliance Score Trends',
      description: '14-day historical tracking with sparkline visualization',
      icon: Activity,
    },
    {
      label: 'Framework Health Monitoring',
      description: 'Per-framework readiness with gap detection',
      icon: FileCheck,
    },
    {
      label: 'Regression Alerts',
      description: 'Automatic detection of >10% score drops',
      icon: AlertTriangle,
    },
    {
      label: 'Automation Analytics',
      description: 'Task velocity, completion rates, and trigger history',
      icon: BarChart3,
    },
    {
      label: 'Cross-Framework Insights',
      description: 'Deduplicated control library shows shared requirements',
      icon: GitBranch,
    },
    {
      label: 'Evidence Pack Exports',
      description: 'One-click auditor-ready ZIP bundles with context',
      icon: Database,
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6"
          >
            <Activity className="w-4 h-4" />
            Compliance Intelligence Dashboard
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Live Visibility Into Your
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {' '}
              Compliance Posture
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built-in analytics engine provides real-time compliance insights,
            historical trends, and predictive regression alerts—no manual
            reporting required.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {intelligenceFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.label}
                </h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// BUILT FOR COMPLEX ORGANIZATIONS
// ============================================

function BuiltForComplex() {
  const scales = [
    { label: 'Multi-site operations', icon: Globe },
    { label: 'Cross-departmental governance', icon: GitBranch },
    { label: 'External auditors and regulators', icon: Users },
    { label: 'Executive oversight', icon: Eye },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
          >
            <Building2 className="w-4 h-4" />
            Built for Complex Organizations
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            One System. One Source of Truth.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Whether you manage one site or hundreds, FormaOS scales across:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {scales.map((scale, index) => {
              const Icon = scale.icon;
              return (
                <motion.div
                  key={scale.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-gray-300">{scale.label}</span>
                </motion.div>
              );
            })}
          </div>

          <p className="text-lg font-medium text-white">
            Full organizational alignment.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// WHO FORMAOS IS FOR
// ============================================

function WhoIsFor() {
  const audiences = [
    { label: 'Compliance leaders who need certainty', icon: Shield },
    { label: 'Executives who need defensibility', icon: TrendingUp },
    { label: 'Operations teams who need clarity', icon: Settings },
    { label: 'Auditors who demand evidence', icon: FileCheck },
    { label: 'Organizations that cannot afford failure', icon: AlertTriangle },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6"
          >
            <Users className="w-4 h-4" />
            Who FormaOS Is For
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Built for Those Who
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {' '}
              Can't Afford to Guess
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
              >
                <Icon className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-gray-300">{audience.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// THE OUTCOME
// ============================================

function TheOutcome() {
  const outcomes = [
    'Continuous compliance, not periodic checks',
    'Reduced audit risk and preparation time',
    'Clear ownership of every obligation',
    'Defensible, regulator-ready evidence',
    'A governance system that actually runs',
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
            >
              <TrendingUp className="w-4 h-4" />
              The Outcome
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              What Organizations Achieve with FormaOS
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {outcomes.map((outcome, index) => (
              <motion.div
                key={outcome}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-gray-300">{outcome}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FINAL CTA
// ============================================

function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white"
            >
              Most platforms <span className="text-gray-500">store</span>{' '}
              compliance.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                FormaOS operates it.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              From obligation to execution, validation, and defense. FormaOS is
              the operating system for modern compliance.
            </motion.p>
          </div>

          <div className="px-8 sm:px-12 py-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
            >
              <Link
                href="/contact"
                className="group w-full sm:w-auto relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Request a Demo</span>
              </Link>

              <Link
                href={`${appBase}/auth/signup`}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-gray-300 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Full platform access
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export default function ProductPageContent() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c] overflow-x-hidden">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]" />
        <div className="absolute inset-0 opacity-30">
          <CinematicField />
        </div>
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <ProductHero />
        <WhatIsFormaOS />
        <VisualDivider />
        <ObligationToExecution />
        <VisualDivider />
        <OperatingModel />
        <VisualDivider />
        <WhatMakesDifferent />
        <VisualDivider />
        <EnterpriseSecurity />
        <ComplianceIntelligence />
        <BuiltForComplex />
        <WhoIsFor />
        <VisualDivider />
        <TheOutcome />
        <FinalCTA />
      </div>
    </div>
  );
}
