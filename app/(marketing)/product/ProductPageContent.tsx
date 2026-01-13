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
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Clean gradient background - NO motion elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/3" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Platform Overview"
            title={<>FormaOS is designed to operationalize<br className="hidden sm:inline" /><span className="text-gradient">compliance across the entire organization</span></>}
            subtitle="It connects obligations, controls, tasks, and evidence into a unified governance model. This is not policy storage. It is compliance as an operating function."
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Structure"
              description="Model your organization, entities, sites, and roles. Define ownership and accountability for every control."
              delay={0}
            />
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Execute"
              description="Convert obligations into operational tasks with due dates, assignees, and required evidence."
              delay={0.1}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Verify"
              description="Track control completion in real time. Capture evidence directly inside the system with full traceability."
              delay={0.2}
            />
            <ValueProp
              icon={<TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Audit"
              description="Generate audit-ready reports without manual compilation. Every action is time-stamped, attributable, and defensible."
              delay={0.3}
            />

          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Workflow Integration */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Governance Model"
            title={<>FormaOS enforces governance<br className="hidden sm:inline" /><span className="text-gradient">through system design</span></>}
            subtitle="Nothing exists in isolation. Every activity is part of a traceable compliance chain."
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Obligations mapped to controls</h4>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Controls mapped to accountable owners</h4>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Tasks linked to execution</h4>
            </div>
            <div className="text-center">
              <Database className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Evidence attached to outcomes</h4>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Key Features */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(139, 92, 246, 0.08)", "rgba(0, 212, 251, 0.06)", "rgba(20, 184, 166, 0.04)"]}
            className="opacity-50"
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Built for Scale"
            title={<>FormaOS supports<br className="hidden sm:inline" /><span className="text-gradient">enterprise complexity</span></>}
            subtitle=""
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <Database className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Multi-entity organizations</h4>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Multi-site operations</h4>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Role-based governance structures</h4>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-base mb-2">Cross-team accountability</h4>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-8"
          >
            <Shield className="h-3 w-3 text-primary" />
            Closing
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight font-display tracking-tight mb-6">
            Compliance should be operational,<br />
            <span className="text-gradient">not administrative.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link href="/contact" className="w-full sm:w-auto rounded-md bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              Request a Demo
            </Link>
            <Link href="/auth/signup" className="w-full sm:w-auto text-base font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </CinematicSection>
    </div>
  );
}