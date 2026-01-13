"use client";

import Link from "next/link";
import { Database, Target, Zap, Shield, TrendingUp, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  GradientMesh,
  InteractiveCard,
  ParticleField,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";
import { MarketingAnchor } from "./marketing-anchor";

function HomeHero() {
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
              Operational Compliance<br />
              <span className="relative">
                <span className="text-gradient">Built for Real Teams</span>
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
              Transform regulatory obligations into executable controls, traceable evidence, and audit-ready governance — all inside one system of record.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 mb-8"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/contact" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
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
              <span>• Australian-hosted</span>
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
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={25} 
            colors={["rgba(0, 212, 251, 0.3)", "rgba(139, 92, 246, 0.25)"]}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="From Compliance Work to Compliance Infrastructure"
            title={<>Replace fragmented spreadsheets,<br className="hidden sm:inline" /><span className="text-gradient">document silos, and manual audits</span></>}
            subtitle="FormaOS replaces fragmented spreadsheets, document silos, and manual audits with a single operational layer for governance. Every policy, control, task, and piece of evidence is connected, monitored, and defensible — by design."
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Model Obligations"
              description="Convert regulations into structured policies and controls."
              delay={0}
            />
            <ValueProp
              icon={<Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Execute Tasks"
              description="Assign ownership, due dates, and accountability across teams."
              delay={0.1}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Prove Readiness"
              description="Generate audit-ready evidence and reports in minutes."
              delay={0.2}
            />
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Live Platform Metrics */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Live Platform Metrics"
            title={<>Real-Time Compliance<br className="hidden sm:inline" /><span className="text-gradient">Intelligence</span></>}
            subtitle="FormaOS continuously measures your organization's compliance posture — across teams, frameworks, and operational controls — without manual tracking."
            alignment="center"
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-2">94%</div>
              <div className="text-sm sm:text-base text-foreground/70">Average Compliance Posture</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-2">127</div>
              <div className="text-sm sm:text-base text-foreground/70">Active Controls</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-2">&lt; 2 min</div>
              <div className="text-sm sm:text-base text-foreground/70">Audit Export Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-2">98%</div>
              <div className="text-sm sm:text-base text-foreground/70">Task Completion Rate</div>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* How It Works */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={25} 
            colors={["rgba(0, 212, 251, 0.3)", "rgba(139, 92, 246, 0.25)"]}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="How It Works"
            title={<>A System Designed for<br className="hidden sm:inline" /><span className="text-gradient">Daily Operations</span></>}
            subtitle="Compliance shouldn't be a quarterly fire drill. FormaOS embeds governance directly into everyday workflows — making compliance part of how your organization runs."
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">1</div>
              <h3 className="text-lg font-semibold mb-2">Structure</h3>
              <p className="text-sm text-foreground/80">Model your organization, sites, and teams with clear ownership and framework alignment.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">2</div>
              <h3 className="text-lg font-semibold mb-2">Execute</h3>
              <p className="text-sm text-foreground/80">Turn controls into operational tasks with due dates, assignees, and accountability chains.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">3</div>
              <h3 className="text-lg font-semibold mb-2">Verify</h3>
              <p className="text-sm text-foreground/80">Capture evidence automatically and monitor completion in real time.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">4</div>
              <h3 className="text-lg font-semibold mb-2">Audit</h3>
              <p className="text-sm text-foreground/80">Export defensible reports in minutes — not weeks.</p>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Why FormaOS */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Why FormaOS"
            title={<>Compliance That<br className="hidden sm:inline" /><span className="text-gradient">Actually Operates</span></>}
            subtitle=""
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mt-12">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h4 className="font-semibold text-base">Built for regulated industries</h4>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h4 className="font-semibold text-base">Framework-driven by design</h4>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h4 className="font-semibold text-base">Evidence is generated, not hunted</h4>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h4 className="font-semibold text-base">Governance without administrative overhead</h4>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h4 className="font-semibold text-base">Scales from small teams to enterprise operations</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA with gradient mesh */}
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
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 glass-intense rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-6 border border-secondary/30">
            Start Your Compliance Transformation
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight font-display tracking-tight mb-6">
            Start Your Compliance Transformation
          </h2>
          
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8">
            Move from tracking compliance to operationalizing it. FormaOS gives your organization a single system of record for governance, risk, and accountability.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              Start Free Trial
            </Link>
            <Link href="/contact" className="w-full sm:w-auto text-base font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
              Talk to a Specialist <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </CinematicSection>
    </div>
  );
}