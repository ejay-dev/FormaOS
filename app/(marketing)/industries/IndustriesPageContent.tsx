'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  Building2,
  Heart,
  Users,
  FileCheck,
  Shield,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  InteractiveCard,
  GradientMesh,
} from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


function IndustriesHero() {
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
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-blue-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8 backdrop-blur-sm"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Industry Solutions
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              One OS. Multiple
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Regulatory Frameworks.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS adapts to your industry's requirements. Pre-built
              frameworks. Enforced controls. Evidence that auditors trust.
            </motion.p>

            {/* Industry Context */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Framework-agnostic compliance infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  NDIS & Aged Care
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Healthcare
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Financial Services
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
                  boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all"
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
          <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default function IndustriesPageContent() {
  return (
    <div>
      <IndustriesHero />

      <VisualDivider />

      {/* Industry Use Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <Building2 className="h-3 w-3" />
              Industry Use
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
              FormaOS is built for environments where
              <br className="hidden sm:inline" />
              <span className="text-gradient">
                accountability, traceability, and audit readiness are not
                optional
              </span>
            </h2>

            <div className="w-20 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full" />
          </motion.div>

          {/* Mission Critical Context */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-xl p-8 sm:p-12">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-6">
                  When compliance failures have serious consequences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-foreground/70">
                  <div className="text-center">
                    <div className="w-2 h-2 bg-rose-400 rounded-full mx-auto mb-3" />
                    <p className="font-medium">Legal liability and penalties</p>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mb-3" />
                    <p className="font-medium">
                      License suspension or revocation
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mx-auto mb-3" />
                    <p className="font-medium">
                      Reputational and operational damage
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Example Verticals */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Verticals Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Shield className="h-3 w-3" />
              Example Verticals
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Compliance infrastructure
              <br className="hidden sm:inline" />
              <span className="text-gradient">across regulated industries</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Industry Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Industries Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Industries Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Regulated Industry Solutions
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Pre-built frameworks tailored to specific regulatory
                    environments
                  </p>
                </div>
              </div>

              {/* Industries Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <div className="backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 group-hover:border-pink-300/30 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Heart className="h-6 w-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 group-hover:text-pink-600 transition-colors duration-300">
                            Disability and Aged Care
                          </h4>
                        </div>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                        Operationalize NDIS, quality standards, safeguarding,
                        incident management, and audits.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-pink-400 rounded-full" />
                          <span>Practice Standards 1-8</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-pink-400 rounded-full" />
                          <span>Incident Management</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-pink-400 rounded-full" />
                          <span>Worker Screening</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <div className="backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 group-hover:border-blue-300/30 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors duration-300">
                            Healthcare and Allied Health
                          </h4>
                        </div>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                        Manage accreditation, clinical governance, compliance
                        workflows, and evidence tracking.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          <span>NSQHS Standards</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          <span>Clinical Governance</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          <span>Safety & Risk</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <div className="backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 group-hover:border-green-300/30 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 group-hover:text-green-600 transition-colors duration-300">
                            Financial Services
                          </h4>
                        </div>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                        Track regulatory obligations, risk controls, internal
                        audits, and compliance reporting.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-green-400 rounded-full" />
                          <span>Regulatory Tracking</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-green-400 rounded-full" />
                          <span>Risk Controls</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-green-400 rounded-full" />
                          <span>Internal Audits</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group"
                  >
                    <div className="backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 group-hover:border-orange-300/30 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Building2 className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 group-hover:text-orange-600 transition-colors duration-300">
                            Construction and Infrastructure
                          </h4>
                        </div>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                        Manage safety systems, contractor compliance, incident
                        reporting, and regulatory audits.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-orange-400 rounded-full" />
                          <span>Safety Systems</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-orange-400 rounded-full" />
                          <span>Contractor Compliance</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-orange-400 rounded-full" />
                          <span>Incident Reporting</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group md:col-span-2 xl:col-span-1"
                  >
                    <div className="backdrop-blur-sm bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 group-hover:border-purple-300/30 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 group-hover:text-purple-600 transition-colors duration-300">
                            Education and Childcare
                          </h4>
                        </div>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                        Control policy adherence, staff compliance, risk
                        management, and inspection readiness.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-purple-400 rounded-full" />
                          <span>Policy Adherence</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-purple-400 rounded-full" />
                          <span>Staff Compliance</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <div className="w-1 h-1 bg-purple-400 rounded-full" />
                          <span>Inspection Readiness</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Why It Works Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Principles Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80">
              <FileCheck className="h-3 w-3" />
              Why It Works Across Industries
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Universal compliance
              <br className="hidden sm:inline" />
              <span className="text-gradient">design principles</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Principles Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Principles Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Principles Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Cross-Industry Design Philosophy
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Four core principles that make FormaOS effective across all
                    regulated environments
                  </p>
                </div>
              </div>

              {/* Principles Grid */}
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <FileCheck className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs font-bold flex items-center justify-center">
                          1
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                      Obligations are structured as system logic
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Regulatory requirements become enforceable workflows, not
                      checklists
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Shield className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                          2
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-green-600 transition-colors duration-300">
                      Controls are enforced operationally
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Compliance happens through daily work, not separate
                      activities
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Building2 className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center">
                          3
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      Evidence is captured continuously
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Proof of compliance accumulates automatically as work
                      happens
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <TrendingUp className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold flex items-center justify-center">
                          4
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-orange-600 transition-colors duration-300">
                      Audits become reporting, not reconstruction
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete audit trails exist in real-time, ready for
                      inspection
                    </p>
                  </motion.div>
                </div>

                {/* Design Philosophy */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10 text-center"
                >
                  <h4 className="text-lg font-bold mb-4">
                    This design philosophy makes FormaOS effective across any
                    regulatory environment
                  </h4>
                  <p className="text-sm text-foreground/70 max-w-3xl mx-auto">
                    Whether managing NDIS obligations, healthcare accreditation,
                    financial regulations, or construction safety – the core
                    principle remains the same: compliance should be
                    operational, not administrative.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Legacy NDIS Section - Remove or keep for reference */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Clean gradient background - NO motion elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/3" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="NDIS Service Providers"
            title={
              <>
                Pre-built practice standards
                <br className="hidden sm:inline" />
                <span className="text-gradient">for audit readiness</span>
              </>
            }
            subtitle="Complete workflows for NDIS Quality and Safeguarding Commission compliance"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={
                <FileCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              }
              title="Practice Standards Workflows"
              description="Pre-configured controls for all 8 NDIS practice standards with evidence templates and approval processes"
              delay={0}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Incident Management"
              description="Structured incident reporting, investigation workflows, and NDIA notification requirements tracking"
              delay={0.1}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Worker Screening"
              description="Manage clearances, training records, and competency assessments with automated compliance tracking"
              delay={0.2}
            />
            <ValueProp
              icon={
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              }
              title="Governance & Leadership"
              description="Board oversight, risk management, and strategic planning controls with executive reporting"
              delay={0.3}
            />
            <ValueProp
              icon={<Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Person-Centered Practice"
              description="Individual outcome tracking, service planning documentation, and participant feedback systems"
              delay={0.4}
            />
            <ValueProp
              icon={
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              }
              title="Continuous Improvement"
              description="Service review cycles, corrective action tracking, and quality improvement planning"
              delay={0.5}
            />
          </div>

          <InteractiveCard
            className="mt-8 sm:mt-12"
            glowColor="rgba(139, 92, 246, 0.2)"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Ready for NDIS audits from day one
                </h3>
                <p className="text-foreground/80 mb-6">
                  Our NDIS framework comes with 200+ pre-built controls,
                  evidence templates, and workflow automation that maps directly
                  to NDIA requirements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Book NDIS Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`${appBase}/auth/signup`}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary/20 text-foreground font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="font-semibold mb-4">
                  Included NDIS Components:
                </h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li>• Practice Standards 1-8 complete framework</li>
                  <li>• Incident reporting and NDIA notifications</li>
                  <li>• Worker screening and training management</li>
                  <li>• Quality review and audit preparation tools</li>
                  <li>• Participant feedback and outcome tracking</li>
                  <li>• Risk management and mitigation workflows</li>
                </ul>
              </div>
            </div>
          </InteractiveCard>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Healthcare & Allied Health */}
      <CinematicSection
        backgroundType="nodes"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Healthcare & Allied Health"
            title={
              <>
                Integrated health service
                <br className="hidden sm:inline" />
                <span className="text-gradient">compliance frameworks</span>
              </>
            }
            subtitle="AHPRA registration, clinical governance, and safety requirements in one system"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Clinical Governance
                </h3>
                <p className="text-foreground/80">
                  Evidence-based practice protocols, clinical incident
                  management, and quality improvement frameworks aligned with
                  NSQHS standards.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Professional Standards
                </h3>
                <p className="text-foreground/80">
                  AHPRA registration tracking, CPD management, and professional
                  supervision documentation with automated compliance alerts.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Safety & Risk Management
                </h3>
                <p className="text-foreground/80">
                  Patient safety incident reporting, risk assessment workflows,
                  and corrective action tracking with clinical review processes.
                </p>
              </div>
            </div>

            <InteractiveCard
              glowColor="rgba(0, 212, 251, 0.15)"
              className="h-fit"
            >
              <div>
                <h4 className="text-lg sm:text-xl font-bold mb-4">
                  Healthcare Framework Includes:
                </h4>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>NSQHS Standards compliance tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Clinical incident and near-miss reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Medication management protocols</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Infection prevention and control measures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Patient rights and engagement processes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Clinical handover and communication</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center w-full px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Healthcare Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Community Services */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh
            colors={[
              'rgba(139, 92, 246, 0.08)',
              'rgba(0, 212, 251, 0.06)',
              'rgba(20, 184, 166, 0.04)',
            ]}
            className="opacity-50"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Community Services"
            title={
              <>
                Standardized controls
                <br className="hidden sm:inline" />
                <span className="text-gradient">across all programs</span>
              </>
            }
            subtitle="Maintain evidence traceability and governance reporting for diverse service delivery"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Program Governance
                </h3>
                <p className="text-foreground/80 mb-4">
                  Unified oversight across multiple programs with
                  service-specific controls, outcome tracking, and stakeholder
                  reporting.
                </p>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Service delivery framework alignment</li>
                  <li>• Outcome measurement and reporting</li>
                  <li>• Stakeholder engagement tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Safety & Wellbeing
                </h3>
                <p className="text-foreground/80 mb-4">
                  Child safety, vulnerable person protection, and incident
                  management across all service touchpoints.
                </p>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Working with Children Check tracking</li>
                  <li>• Mandatory reporting procedures</li>
                  <li>• Safety incident investigation workflows</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Quality Assurance
                </h3>
                <p className="text-foreground/80 mb-4">
                  Continuous improvement processes with service reviews,
                  corrective actions, and quality planning.
                </p>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Service review and evaluation cycles</li>
                  <li>• Client feedback and complaint management</li>
                  <li>• Quality improvement planning</li>
                </ul>
              </div>

              <InteractiveCard
                glowColor="rgba(20, 184, 166, 0.15)"
                className="p-6"
              >
                <h4 className="text-lg font-bold mb-3">
                  Ready to streamline compliance?
                </h4>
                <p className="text-sm text-foreground/80 mb-4">
                  Get a demo tailored to your community services requirements.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  Community Services Demo{' '}
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </InteractiveCard>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Premium CTA background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-background to-blue-900/10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Premium Executive CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Executive CTA Panel */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-5xl mx-auto">
              {/* CTA Header */}
              <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-6 sm:px-8 py-6 sm:py-8">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80"
                  >
                    <Building2 className="h-3 w-3" />
                    Ready for Enterprise
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                  >
                    If your organization operates under regulation,
                    <br className="hidden lg:inline" />
                    <span className="text-gradient">
                      FormaOS provides the system to run compliance as part of
                      daily operations.
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

              {/* CTA Content */}
              <div className="px-6 sm:px-8 py-8 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                  {/* Industry Promise */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-center lg:text-left"
                  >
                    <h3 className="text-xl sm:text-2xl font-bold mb-6">
                      Pre-built compliance infrastructure for your industry
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-foreground/70">
                          Industry-specific frameworks ready from day one
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-sm text-foreground/70">
                          Complete regulatory mapping and controls
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-sm text-foreground/70">
                          Audit-ready evidence capture and reporting
                        </span>
                      </div>
                    </div>

                    <p className="text-base text-foreground/60 leading-relaxed">
                      See how FormaOS transforms compliance from a quarterly
                      burden into daily operational certainty for your specific
                      regulatory environment.
                    </p>
                  </motion.div>

                  {/* CTA Actions */}
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
                          Request Industry Demo
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      <Link
                        href={`${appBase}/auth/signup`}
                        className="group w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-foreground/90 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                      >
                        <span>Start Free Trial</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>

                    <div className="text-xs text-foreground/50">
                      No credit card required • Full platform access • Industry
                      framework included
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
