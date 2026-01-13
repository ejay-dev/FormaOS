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
              Compliance OS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Compliance infrastructure<br />
              <span className="relative">
                <span className="text-gradient">built for audit defense</span>
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
              Turn compliance chaos into defensible workflows. Connect policies, evidence, and audit trails into a single platform designed for regulated teams.
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
            badge="Complete Platform"
            title={<>End-to-end compliance<br className="hidden sm:inline" /><span className="text-gradient">management system</span></>}
            subtitle="FormaOS unifies policies, tasks, evidence, and audit trails into a single defensible workflow"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Policy Engine"
              description="Version-controlled policies with review cadence, ownership, and staff acknowledgement tracking"
              delay={0}
            />
            <ValueProp
              icon={<Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Task Management"
              description="Turn controls into tasks with due dates, assignees, and accountability chains"
              delay={0.1}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Evidence Vault"
              description="Store artifacts with approval history, mapped controls, and audit-ready context"
              delay={0.2}
            />
            <ValueProp
              icon={<Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Audit Trail"
              description="Immutable logs of evidence decisions, task completion, and control evaluations"
              delay={0.3}
            />
            <ValueProp
              icon={<TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Compliance Frameworks"
              description="Align requirements to frameworks, score posture, and generate audit exports"
              delay={0.4}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Reporting Engine"
              description="Executive dashboards, risk summaries, and readiness reports in minutes"
              delay={0.5}
            />
          </div>

          <InteractiveCard 
            className="mt-12 sm:mt-16 text-center"
            glowColor="rgba(139, 92, 246, 0.2)"
          >
            <p className="text-lg sm:text-xl md:text-2xl font-semibold font-display mb-3 sm:mb-4">
              No scattered tools. No last-minute audit scrambles. No blind spots.
            </p>
            <p className="text-base sm:text-lg text-foreground/70">
              Just clarity, structure, and confidence.
            </p>
          </InteractiveCard>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* For Regulated Teams */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Built for Regulated Teams"
            title={<>Infrastructure for<br className="hidden sm:inline" /><span className="text-gradient">operational trust</span></>}
            subtitle="Designed for teams responsible for safety, compliance, outcomes, and trust"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">NDIS Service Providers</h3>
                <p className="text-foreground/80">
                  Pre-built practice standards workflows with automated evidence collection and audit-ready reporting.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Healthcare & Allied Health</h3>
                <p className="text-foreground/80">
                  Integrated health service frameworks covering AHPRA registration, governance, and safety requirements.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Community Services</h3>
                <p className="text-foreground/80">
                  Standardize controls across programs while maintaining evidence traceability and governance reporting.
                </p>
              </div>
            </div>
            
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.15)"
              className="h-fit"
            >
              <div className="text-center">
                <h4 className="text-lg sm:text-xl font-bold mb-4">Ready to transform compliance?</h4>
                <p className="text-foreground/80 mb-6">
                  See how FormaOS works for your industry with a personalized demo.
                </p>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center justify-center w-full px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Request Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </InteractiveCard>
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
        
        <MarketingAnchor 
          title="Ready to transform compliance?"
          subtitle="Start your free trial and see FormaOS in action"
          badge="Get Started"
        />
      </CinematicSection>
    </div>
  );
}