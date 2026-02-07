'use client';

import Link from 'next/link';
import {
  Database,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  GradientMesh,
  InteractiveCard,
} from '@/components/motion';
import {
  PulsingNode,
  ParallaxLayer,
} from '@/components/motion/CleanBackground';
import { MarketingAnchor } from './marketing-anchor';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

function HomeHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Soft gradient overlays instead of motion lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 via-transparent to-primary/5" />
      </div>

      {/* Subtle pulsing nodes - hidden on mobile */}
      <div className="hidden sm:block">
        <PulsingNode x="12%" y="25%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="88%" y="35%" delay={0.5} />
        <PulsingNode x="18%" y="75%" delay={1} />
        <PulsingNode x="82%" y="85%" delay={1.5} color="rgb(6, 182, 212)" />
      </div>

      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-secondary/20 blur-[60px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[250px] sm:h-[500px] w-[250px] sm:w-[500px] rounded-full bg-primary/15 blur-[50px] sm:blur-[100px]" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <ParallaxLayer speed={0.3}>
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-secondary/30"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Database className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Enterprise Compliance OS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Operational Compliance,
              <br />
              <span className="relative">
                <span className="text-gradient">
                  Built for Real Organizations
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-secondary via-primary to-accent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8"
            >
              FormaOS is a compliance operating system for regulated teams. It
              turns obligations into structured controls, tracked actions, and
              audit-ready evidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-sm sm:text-lg text-foreground/60 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              <p>
                Most compliance tools store documents. FormaOS runs compliance.
              </p>
              <p className="mt-2">
                It gives organizations a single system to model governance,
                assign accountability, verify execution, and prove outcomes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 mb-8"
            >
              <Link
                href={`${appBase}/auth/signup`}
                className="w-full sm:w-auto btn btn-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto btn btn-ghost px-6 py-3 text-sm font-semibold leading-6 flex items-center justify-center sm:justify-start gap-2"
              >
                Request Demo <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-foreground/60"
            >
              <span>• 14-day free trial</span>
              <span>• No credit card required</span>
              <span>• Region-aware hosting</span>
            </motion.div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

export function HomePageClient() {
  return (
    <div>
      <HomeHero />

      <VisualDivider />

      {/* Platform Overview */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Database className="h-3 w-3" />
              Value Statement
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              From framework alignment to audit export,
              <br className="hidden sm:inline" />
              <span className="text-gradient">
                every compliance activity is connected
              </span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />

            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              FormaOS replaces fragmented spreadsheets, disconnected policy
              tools, and manual audits with a structured operating layer for
              governance.
            </p>
          </motion.div>

          {/* Premium Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                {/* Premium Card Container */}
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  {/* Floating Icon */}
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Target className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                      Model Obligations
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Convert regulations into structured policies and controls.
                    </p>
                  </div>

                  {/* Subtle accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Zap className="h-10 w-10 text-secondary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-secondary to-accent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 group-hover:text-secondary transition-colors duration-300">
                      Execute Tasks
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Assign ownership, due dates, and accountability across
                      teams.
                    </p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Shield className="h-10 w-10 text-accent" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 group-hover:text-accent transition-colors duration-300">
                      Prove Readiness
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Generate audit-ready evidence and reports in minutes.
                    </p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Live Platform Metrics */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Premium analytics background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-background to-slate-800/5" />
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/[0.03] via-transparent to-primary/[0.03]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Analytics Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <TrendingUp className="h-3 w-3" />
              Live Platform Metrics
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Real-Time Compliance
              <br className="hidden sm:inline" />
              <span className="text-gradient">Intelligence</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />

            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              FormaOS continuously measures your organization's compliance
              posture across teams, frameworks, and operational controls,
              without manual tracking.
            </p>
          </motion.div>

          {/* Premium Analytics Grid */}
          <div className="relative">
            {/* Analytics Dashboard Container */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Dashboard Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-foreground/80">
                      Live Compliance Dashboard
                    </span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    Updated in real-time
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-4">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform duration-300">
                        94%
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    </div>
                    <div className="text-sm sm:text-base text-foreground/70 font-medium">
                      Average Compliance Posture
                    </div>
                    <div className="mt-2 w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '94%' }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-4">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform duration-300">
                        127
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-secondary/10 via-accent/10 to-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    </div>
                    <div className="text-sm sm:text-base text-foreground/70 font-medium">
                      Active Controls
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-accent rounded-full animate-pulse"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-4">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform duration-300">
                        Fast
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    </div>
                    <div className="text-sm sm:text-base text-foreground/70 font-medium">
                      Audit Export Time
                    </div>
                    <div className="mt-2">
                      <div className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Quick generation
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-4">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform duration-300">
                        98%
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    </div>
                    <div className="text-sm sm:text-base text-foreground/70 font-medium">
                      Task Completion Rate
                    </div>
                    <div className="mt-2 w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '98%' }}
                        viewport={{ once: true }}
                        transition={{ delay: 1, duration: 1 }}
                        className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* How It Works - System Interface Design */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Clean gradient background - NO motion elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Main System Panel Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* System Header Block */}
            <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-4"
                >
                  <Target className="h-3 w-3 text-primary" />
                  How It Works
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-2"
                >
                  A Compliance System Designed for
                  <br className="hidden sm:inline" />
                  <span className="text-gradient">Daily Operations</span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="mx-auto mt-3 h-1 w-24 bg-gradient-to-r from-secondary via-primary to-accent rounded-full"
                />

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mt-4 text-lg text-foreground/70 max-w-3xl mx-auto"
                >
                  Compliance should not live in quarterly reviews. FormaOS
                  embeds governance directly into operational workflows so
                  compliance becomes part of how the organization runs.
                </motion.p>
              </div>
            </div>

            {/* System Module Grid */}
            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {/* STRUCTURE Module */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-2xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 hover:from-primary/[0.08] hover:to-primary/[0.02]">
                    {/* System Status Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white/20">
                      1
                    </div>

                    {/* System Icon Node */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Database className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        Structure
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        Define ownership and accountability. Model your
                        organization, sites, and teams. Assign control ownership
                        and map obligations to responsible roles.
                      </p>
                    </div>

                    {/* System Connection Indicator */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary animate-pulse" />
                  </div>
                </motion.div>

                {/* EXECUTE Module */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-2xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-secondary/30 hover:from-secondary/[0.08] hover:to-secondary/[0.02]">
                    {/* System Status Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white/20">
                      2
                    </div>

                    {/* System Icon Node */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Target className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-secondary transition-colors duration-300">
                        Execute
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        Turn controls into actions. Convert requirements into
                        tasks with due dates, assignees, and evidence
                        requirements.
                      </p>
                    </div>

                    {/* System Connection Indicator */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-secondary/60 group-hover:bg-secondary animate-pulse" />
                  </div>
                </motion.div>

                {/* VERIFY Module */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-2xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-accent/30 hover:from-accent/[0.08] hover:to-accent/[0.02]">
                    {/* System Status Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white/20">
                      3
                    </div>

                    {/* System Icon Node */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors duration-300">
                        Verify
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        Track completion with evidence. Capture proof
                        automatically or manually. Monitor status in real time
                        with a complete audit trail.
                      </p>
                    </div>

                    {/* System Connection Indicator */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-accent/60 group-hover:bg-accent animate-pulse" />
                  </div>
                </motion.div>

                {/* AUDIT Module */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-2xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 hover:from-primary/[0.08] hover:to-primary/[0.02]">
                    {/* System Status Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white/20">
                      4
                    </div>

                    {/* System Icon Node */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        Audit
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        Prove compliance without disruption. Export defensible
                        reports in minutes with every control linked to
                        verifiable evidence.
                      </p>
                    </div>

                    {/* System Connection Indicator */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* System Footer Status */}
            <div className="bg-gradient-to-r from-white/[0.02] to-white/[0.01] border-t border-white/5 px-8 py-4">
              <div className="flex items-center justify-center gap-2 text-xs text-foreground/60">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                System Status: All modules operational
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Why FormaOS */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <Shield className="h-3 w-3" />
              Why FormaOS
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Built for governance,
              <br className="hidden sm:inline" />
              <span className="text-gradient">not checklists</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />

            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              FormaOS is not a document repository or a task manager. It is an
              operating layer for compliance and risk.
            </p>
          </motion.div>

          {/* Premium Capability Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Governance Framework Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Framework Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground/90">
                    Governance Architecture
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Every component connects to provide complete operational
                    visibility
                  </p>
                </div>
              </div>

              {/* Capabilities Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="group flex items-start gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-2 group-hover:text-primary transition-colors duration-300">
                          Controls mapped directly to obligations
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Every control traces back to its regulatory
                          requirement with full lineage
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="group flex items-start gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-6 w-6 text-secondary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-2 group-hover:text-secondary transition-colors duration-300">
                          Actions tied to accountable owners
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Clear responsibility chains with automated escalation
                          and oversight
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="group flex items-start gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Database className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-2 group-hover:text-accent transition-colors duration-300">
                          Evidence stored in a verifiable chain
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Immutable audit trails with tamper-evident logging
                          and timestamps
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="group flex items-start gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-2 group-hover:text-primary transition-colors duration-300">
                          Continuous audit readiness
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          Real-time compliance posture with instant export
                          capabilities
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Connection Indicators */}
                <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-px h-24 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
                  <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent absolute top-12 left-1/2 transform -translate-x-1/2 -translate-y-px" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Capabilities Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Premium layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/10 via-background to-violet-50/10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] via-transparent to-accent/[0.02]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Capabilities Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Zap className="h-3 w-3" />
              Capabilities
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Model obligations. Execute tasks.
              <br className="hidden sm:inline" />
              <span className="text-gradient">Prove readiness.</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-6" />

            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              FormaOS unifies compliance into a single operational system.
            </p>
          </motion.div>

          {/* Premium Capability Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Unified System Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* System Overview Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-8">
                <div className="text-center max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold mb-4">
                    Complete Compliance Operating System
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    From regulatory mapping to audit export, every compliance
                    function operates within a single, integrated platform
                    designed for enterprise-grade governance.
                  </p>
                </div>
              </div>

              {/* Capability Flow Visualization */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
                  {/* Model Stage */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="group relative"
                  >
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                          <Database className="h-10 w-10 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex items-center justify-center">
                          1
                        </div>
                      </div>

                      <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        Model
                      </h4>
                      <p className="text-foreground/70 leading-relaxed text-sm">
                        Transform regulations into structured policies,
                        controls, and organizational accountability frameworks.
                      </p>
                    </div>
                  </motion.div>

                  {/* Execute Stage */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="group relative"
                  >
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                          <Target className="h-10 w-10 text-secondary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-secondary to-accent text-white text-xs font-bold flex items-center justify-center">
                          2
                        </div>
                      </div>

                      <h4 className="text-xl font-bold mb-3 group-hover:text-secondary transition-colors duration-300">
                        Execute
                      </h4>
                      <p className="text-foreground/70 leading-relaxed text-sm">
                        Convert controls into actionable tasks with clear
                        ownership, deadlines, and evidence requirements.
                      </p>
                    </div>
                  </motion.div>

                  {/* Prove Stage */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="group relative"
                  >
                    <div className="text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                          <Shield className="h-10 w-10 text-accent" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-primary text-white text-xs font-bold flex items-center justify-center">
                          3
                        </div>
                      </div>

                      <h4 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors duration-300">
                        Prove
                      </h4>
                      <p className="text-foreground/70 leading-relaxed text-sm">
                        Generate verifiable evidence and export audit-ready
                        reports with complete compliance traceability.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Process Flow Connectors (Desktop only) */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2 px-12">
                  <div className="flex items-center justify-between">
                    <div className="w-0 h-0" />
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 mx-8" />
                    <div className="w-0 h-0" />
                    <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-accent/30 to-primary/30 mx-8" />
                    <div className="w-0 h-0" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Who It Is For Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Targeting Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <Users className="h-3 w-3" />
              Who It Is For
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
              Built for organizations that cannot
              <br className="hidden sm:inline" />
              <span className="text-gradient">
                afford ambiguity in compliance
              </span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Audience Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Professional Roles Showcase */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Roles Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Enterprise Compliance Professionals
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Designed for senior leaders who require operational
                    certainty
                  </p>
                </div>
              </div>

              {/* Professional Roles Grid */}
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
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-primary transition-colors duration-300">
                      Compliance & Governance Teams
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Directors and managers responsible for enterprise
                      compliance programs
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Shield className="h-8 w-8 text-secondary" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-secondary to-accent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-secondary transition-colors duration-300">
                      Risk & Audit Leaders
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Chief Risk Officers and audit executives requiring
                      defensible evidence
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Target className="h-8 w-8 text-accent" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-accent to-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-accent transition-colors duration-300">
                      Regulated Operations
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Operations directors in healthcare, finance, and regulated
                      industries
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Database className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-primary transition-colors duration-300">
                      Multi-Entity Organizations
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Executives managing compliance across multiple sites and
                      entities
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Security Section */}
      <CinematicSection
        backgroundType="gradient"
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Security Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80">
              <Shield className="h-3 w-3" />
              Security
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Designed for
              <br className="hidden sm:inline" />
              <span className="text-gradient">regulated environments</span>
            </h2>

            <div className="w-16 h-0.5 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Security Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Security Framework Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Security Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-foreground/80">
                      Enterprise Security Framework
                    </span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    Framework-aligned controls
                  </div>
                </div>
              </div>

              {/* Security Features Grid */}
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Shield className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                      Immutable Audit Logs
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Cryptographically sealed evidence with tamper detection
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Database className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      Encrypted Evidence Storage
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      End-to-end encryption with Australian data sovereignty
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
                          <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      Role-Based Access Control
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Granular permissions with segregation of duties
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
                          <Target className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-orange-600 transition-colors duration-300">
                      Tenant Isolation
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete organizational separation with zero data bleed
                    </p>
                  </motion.div>
                </div>

                {/* Security Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 text-center"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-foreground/80">
                      SOC 2-aligned controls
                    </span>
                  </div>
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
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-24 relative"
      >
        {/* Premium CTA background with subtle mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-background to-indigo-900/10" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh
            colors={[
              'rgba(139, 92, 246, 0.08)',
              'rgba(0, 212, 251, 0.06)',
              'rgba(20, 184, 166, 0.04)',
            ]}
            className="opacity-30"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Premium CTA Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Executive CTA Panel */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* CTA Header */}
              <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Ready to Begin
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto"
                  >
                    Move from tracking to governance.
                    <br className="hidden sm:inline" />
                    <span className="text-gradient">
                      Run compliance as a system.
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
              <div className="px-8 sm:px-12 py-10 sm:py-12 text-center">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10"
                >
                  Join the organizations that have transformed compliance from
                  reactive burden to proactive competitive advantage. Experience
                  operational certainty with FormaOS.
                </motion.p>

                {/* Premium CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8"
                >
                  <Link
                    href={`${appBase}/auth/signup`}
                    className="group w-full sm:w-auto relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>

                  <Link
                    href="/contact"
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-foreground/90 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                  >
                    <span>Request a Demo</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-foreground/60"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Region-aware hosting</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>
    </div>
  );
}
