"use client";

import Link from "next/link";
import { Database, Shield, Target, FileText, TrendingUp, Users, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  InteractiveCard,
  TimelineItem,
  GradientMesh,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";
import { MarketingAnchor } from "../components/marketing-anchor";

function ProductHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Clean system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <CleanSystemGrid />
      </div>
      
      {/* Pulsing nodes - hidden on mobile */}
      <div className="hidden sm:block">
        <PulsingNode x="15%" y="20%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="85%" y="30%" delay={0.5} />
        <PulsingNode x="20%" y="80%" delay={1} />
        <PulsingNode x="80%" y="90%" delay={1.5} color="rgb(6, 182, 212)" />
      </div>
      
      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-secondary/20 blur-[60px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[250px] sm:h-[500px] w-[250px] sm:w-[500px] rounded-full bg-primary/15 blur-[50px] sm:blur-[100px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
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
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Platform Overview
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              A Compliance Operating System<br />
              <span className="relative">
                <span className="text-gradient">for Enterprise Teams</span>
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
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10"
            >
              FormaOS replaces fragmented tools with a single system for governance, execution, and audit readiness.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/contact" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

export default function ProductPageContent() {
  return (
    <div>
      <ProductHero />

      <VisualDivider />

      {/* Core Platform Components */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-24 lg:py-32 relative"
      >
        {/* Premium layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/20 via-background to-slate-100/10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] via-transparent to-secondary/[0.02]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Database className="h-3 w-3" />
              Platform Overview
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
              FormaOS is designed to operationalize<br className="hidden sm:inline" />
              <span className="text-gradient">compliance across the entire organization</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />
            
            <p className="text-lg text-foreground/70 max-w-4xl mx-auto leading-relaxed">
              It connects obligations, controls, tasks, and evidence into a unified governance model. This is not policy storage. It is compliance as an operating function.
            </p>
          </motion.div>

          {/* Premium Core Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Structure Module */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  {/* Module Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                        Structure
                      </h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mt-1" />
                    </div>
                  </div>
                  
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    Model your organization, entities, sites, and roles. Define ownership and accountability for every control.
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Organizational mapping</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Role-based accountability</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Control ownership</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>

            {/* Execute Module */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Target className="h-8 w-8 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-secondary transition-colors duration-300">
                        Execute
                      </h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-secondary to-accent rounded-full mt-1" />
                    </div>
                  </div>
                  
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    Convert obligations into operational tasks with due dates, assignees, and required evidence.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-secondary/60 rounded-full" />
                      <span className="text-foreground/80">Task automation</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-secondary/60 rounded-full" />
                      <span className="text-foreground/80">Due date management</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-secondary/60 rounded-full" />
                      <span className="text-foreground/80">Evidence requirements</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>

            {/* Verify Module */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Shield className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-accent transition-colors duration-300">
                        Verify
                      </h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-accent to-primary rounded-full mt-1" />
                    </div>
                  </div>
                  
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    Track control completion in real time. Capture evidence directly inside the system with full traceability.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-accent/60 rounded-full" />
                      <span className="text-foreground/80">Real-time tracking</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-accent/60 rounded-full" />
                      <span className="text-foreground/80">Evidence capture</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-accent/60 rounded-full" />
                      <span className="text-foreground/80">Audit trail</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>

            {/* Audit Module */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="relative h-full">
                <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 sm:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                        Audit
                      </h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mt-1" />
                    </div>
                  </div>
                  
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    Generate audit-ready reports without manual compilation. Every action is time-stamped, attributable, and defensible.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Instant reporting</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Time-stamped records</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      <span className="text-foreground/80">Defensible evidence</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Workflow Integration */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-24 lg:py-32 relative"
      >
        {/* Premium governance background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/10 via-background to-indigo-50/10" />
        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/[0.02] via-transparent to-primary/[0.02]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Governance Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <Target className="h-3 w-3" />
              Governance Model
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              FormaOS enforces governance<br className="hidden sm:inline" />
              <span className="text-gradient">through system design</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />
            
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Nothing exists in isolation. Every activity is part of a traceable compliance chain.
            </p>
          </motion.div>

          {/* Premium Governance Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Governance Chain Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Governance Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Compliance Traceability Chain
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Every element connects to provide complete operational accountability
                  </p>
                </div>
              </div>
              
              {/* Governance Flow Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                          1
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      Obligations Mapped to Controls
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Every regulatory requirement connects directly to actionable controls
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                          2
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-green-600 transition-colors duration-300">
                      Controls Mapped to Accountable Owners
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Clear ownership and responsibility for every compliance activity
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <CheckCircle className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center">
                          3
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      Tasks Linked to Execution
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Operational activities tracked with completion verification
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Database className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold flex items-center justify-center">
                          4
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-orange-600 transition-colors duration-300">
                      Evidence Attached to Outcomes
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Immutable proof linking actions to compliance results
                    </p>
                  </motion.div>
                </div>
                
                {/* Process Flow Connectors (Desktop only) */}
                <div className="hidden lg:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2 px-20">
                  <div className="flex items-center justify-between">
                    <div className="w-0 h-0" />
                    <ArrowRight className="h-6 w-6 text-blue-400 opacity-60" />
                    <div className="w-0 h-0" />
                    <ArrowRight className="h-6 w-6 text-green-400 opacity-60" />
                    <div className="w-0 h-0" />
                    <ArrowRight className="h-6 w-6 text-purple-400 opacity-60" />
                    <div className="w-0 h-0" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Key Features */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="accent"
        className="py-16 sm:py-24 lg:py-32 relative"
      >
        {/* Premium scale background with subtle mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/10 via-background to-teal-50/10" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(139, 92, 246, 0.08)", "rgba(0, 212, 251, 0.06)", "rgba(20, 184, 166, 0.04)"]}
            className="opacity-30"
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Scale Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80">
              <TrendingUp className="h-3 w-3" />
              Built for Scale
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              FormaOS supports<br className="hidden sm:inline" />
              <span className="text-gradient">enterprise complexity</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Enterprise Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Enterprise Capabilities Container */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Capabilities Header */}
              <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-b border-white/5 px-8 py-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Enterprise-Grade Scalability
                  </h3>
                  <p className="text-sm text-foreground/60 mt-2">
                    Built to handle the most complex organizational structures
                  </p>
                </div>
              </div>
              
              {/* Enterprise Features Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Database className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                      Multi-Entity Organizations
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Manage compliance across subsidiaries and holding companies
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Target className="h-8 w-8 text-teal-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-teal-600 transition-colors duration-300">
                      Multi-Site Operations
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Coordinate compliance across geographic locations
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Users className="h-8 w-8 text-violet-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-violet-600 transition-colors duration-300">
                      Role-Based Governance Structures
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Sophisticated permission hierarchies and delegation
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Shield className="h-8 w-8 text-rose-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-rose-600 transition-colors duration-300">
                      Cross-Team Accountability
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Seamless coordination across departments and functions
                    </p>
                  </motion.div>
                </div>
                
                {/* Enterprise Metrics */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gradient mb-1">1000+</div>
                      <div className="text-xs text-foreground/60">Users Supported</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient mb-1">50+</div>
                      <div className="text-xs text-foreground/60">Sites per Org</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient mb-1">99.9%</div>
                      <div className="text-xs text-foreground/60">Uptime SLA</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient mb-1">24/7</div>
                      <div className="text-xs text-foreground/60">Enterprise Support</div>
                    </div>
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
        ambientColor="primary"
        className="py-16 sm:py-24 lg:py-32 relative"
      >
        {/* Premium CTA background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-background to-indigo-900/10" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Premium CTA Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Executive CTA Panel */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
              {/* CTA Header */}
              <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80"
                  >
                    <Shield className="h-3 w-3" />
                    Ready to Transform
                  </motion.div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                  >
                    Compliance should be operational,<br className="hidden sm:inline" />
                    <span className="text-gradient">not administrative.</span>
                  </motion.h2>
                  
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
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
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-lg text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10"
                >
                  Experience how FormaOS transforms compliance from a quarterly burden into daily operational certainty. See the platform in action.
                </motion.p>
                
                {/* Premium CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8"
                >
                  <Link 
                    href="/contact" 
                    className="group w-full sm:w-auto relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10">Request a Demo</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  
                  <Link 
                    href="/auth/signup" 
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-foreground/90 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>
                
                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-foreground/60"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>Complete platform demo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Free trial with real data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Enterprise setup included</span>
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