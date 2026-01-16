'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  Shield,
  Lock,
  Users,
  Database,
  FileCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CinematicSection, VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';

function SecurityHero() {
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
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-red-500/10 via-orange-500/8 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.35, 0.25],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/12 via-blue-500/8 to-transparent rounded-full blur-3xl"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-red-500/5 to-transparent rounded-full" />
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
            'radial-gradient(circle at 1px 1px, rgba(239, 68, 68, 0.12) 1px, transparent 0)',
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-8 backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium tracking-wide">
                Security Infrastructure
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Security at the
              <br />
              <span className="bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Operating System Layer
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Controls are enforced, not documented. Evidence is captured, not
              requested. Security is structural, not aspirational.
            </motion.p>

            {/* Security Principles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Built into the operating layer
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  Zero-Trust Architecture
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  End-to-End Encryption
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  Immutable Audit Logs
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
                href="/auth"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                <span>Start Secure Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-red-400/50 hover:bg-red-400/5 transition-all"
              >
                <span>Security Whitepaper</span>
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
          <motion.div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default function SecurityPageContent() {
  return (
    <div>
      <SecurityHero />

      <VisualDivider />

      {/* Security Architecture */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Security Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Shield className="h-3 w-3" />
              Security Architecture
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Security is embedded
              <br className="hidden sm:inline" />
              <span className="text-gradient">
                at every layer of the platform
              </span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Security Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Security Framework Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Security Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Multi-Layer Security Architecture
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Enterprise-grade protection across infrastructure,
                    application, and data layers
                  </p>
                </div>
              </div>

              {/* Security Layers Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Lock className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-red-600 transition-colors duration-300">
                      Encrypted Data Protection
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      End-to-end encryption at rest and in transit with
                      enterprise key management
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      Role-Based Access Control
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Granular permissions and multi-factor authentication with
                      zero-trust principles
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Database className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-green-600 transition-colors duration-300">
                      Multi-Tenant Isolation
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete tenant isolation for multi-organization
                      environments with secure data boundaries
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Shield className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      Immutable Audit Logging
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Tamper-proof audit trails with cryptographic verification
                      for regulatory compliance
                    </p>
                  </motion.div>
                </div>

                {/* Security Certifications */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-6">
                      Security Standards & Compliance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">
                          SOC 2
                        </div>
                        <div className="text-xs text-foreground/60">
                          Type II Certified
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">
                          ISO 27001
                        </div>
                        <div className="text-xs text-foreground/60">
                          Information Security
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">
                          GDPR
                        </div>
                        <div className="text-xs text-foreground/60">
                          Privacy Compliant
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">
                          AES 256
                        </div>
                        <div className="text-xs text-foreground/60">
                          Encryption Standard
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Evidence Integrity */}
      <CinematicSection
        backgroundType="nodes"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Evidence Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <FileCheck className="h-3 w-3" />
              Evidence Integrity
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
              Every action, task, and evidence record is
              <br className="hidden sm:inline" />
              <span className="text-gradient">verifiable and traceable</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Evidence Chain */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Evidence Framework Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Evidence Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Evidence Chain of Custody
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Complete traceability from action to audit with
                    cryptographic verification
                  </p>
                </div>
              </div>

              {/* Evidence Properties Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <FileCheck className="h-8 w-8 text-amber-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center">
                          1
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-amber-600 transition-colors duration-300">
                      Time-Stamped
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Precision timestamps with blockchain-verified
                      chronological integrity
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Users className="h-8 w-8 text-teal-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                          2
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-teal-600 transition-colors duration-300">
                      User Attribution
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Cryptographically signed by authenticated user with
                      non-repudiation guarantees
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Database className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center">
                          3
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                      Control Linkage
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Direct mapping to regulatory obligations with automated
                      compliance verification
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Shield className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 text-white text-xs font-bold flex items-center justify-center">
                          4
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                      Audit Preservation
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Immutable storage with cryptographic proofs for long-term
                      regulatory compliance
                    </p>
                  </motion.div>
                </div>

                {/* Evidence Quality Metrics */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-6">
                      Evidence Quality Standards
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">
                          100%
                        </div>
                        <div className="text-xs text-foreground/60">
                          Audit Traceability
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">
                          0
                        </div>
                        <div className="text-xs text-foreground/60">
                          Data Loss Incidents
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">
                          &lt;1s
                        </div>
                        <div className="text-xs text-foreground/60">
                          Evidence Retrieval
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">
                          99.99%
                        </div>
                        <div className="text-xs text-foreground/60">
                          System Uptime
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Compliance by Design */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Compliance Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80">
              <Shield className="h-3 w-3" />
              Compliance by Design
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              FormaOS is built to
              <br className="hidden sm:inline" />
              <span className="text-gradient">support regulatory scrutiny</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-8" />

            <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed font-medium">
              There is no hidden state. No untraceable action. No undocumented
              outcome.
            </p>
          </motion.div>

          {/* Premium Transparency Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Transparency Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Transparency Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 sm:px-12 py-8 sm:py-10">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Complete Operational Transparency
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    FormaOS operates under the principle that compliance systems
                    must be fully transparent, auditable, and verifiable at all
                    times. Every system component is designed for scrutiny.
                  </p>
                </div>
              </div>

              {/* Transparency Principles */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-cyan-600">
                          ∅
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">No Hidden State</h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Every data point, process state, and system condition is
                      visible and queryable through audit interfaces
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-violet-600">
                          →
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">
                      Traceable Actions
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete action lineage from user intent to system outcome
                      with immutable proof chains
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          ✓
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">
                      Documented Outcomes
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Automatic documentation of all compliance outcomes with
                      regulatory mapping and evidence
                    </p>
                  </motion.div>
                </div>

                {/* Design Philosophy Statement */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10 text-center"
                >
                  <h4 className="text-lg font-bold mb-4">
                    Designed for Regulatory Confidence
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                    When auditors, regulators, or compliance teams examine
                    FormaOS, they find a system that anticipates their questions
                    and provides verifiable answers. This level of transparency
                    is not an accident – it is the fundamental design principle
                    of the platform.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Premium security CTA background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-background to-violet-900/10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Premium Security CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Executive Security Panel */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
              {/* Security CTA Header */}
              <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80"
                  >
                    <Shield className="h-3 w-3" />
                    Security First
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                  >
                    Security is not a feature.
                    <br className="hidden sm:inline" />
                    <span className="text-gradient">
                      It is the foundation of governance.
                    </span>
                  </motion.h2>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-8"
                  />
                </div>
              </div>

              {/* Security CTA Content */}
              <div className="px-8 sm:px-12 py-10 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Security Promise */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-center lg:text-left"
                  >
                    <h3 className="text-xl sm:text-2xl font-bold mb-6">
                      Enterprise security meets compliance requirements
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-foreground/70">
                          SOC 2 Type II and ISO 27001 certified infrastructure
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-sm text-foreground/70">
                          End-to-end encryption with enterprise key management
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-sm text-foreground/70">
                          Immutable audit trails with cryptographic verification
                        </span>
                      </div>
                    </div>

                    <p className="text-base text-foreground/60 leading-relaxed">
                      Get a comprehensive security overview tailored to your
                      compliance requirements and regulatory environment.
                    </p>
                  </motion.div>

                  {/* Security CTA Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-center"
                  >
                    <div className="space-y-4 mb-8">
                      <Link
                        href="/contact"
                        className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
                      >
                        <span className="relative z-10">
                          Request Security Overview
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      <Link
                        href="/auth/signup"
                        className="group w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-foreground/90 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                      >
                        <span>Start Secure Trial</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>

                    <div className="text-xs text-foreground/50">
                      SOC 2 compliant • GDPR ready • Enterprise security
                      standards
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>
    </div>
  );
}
