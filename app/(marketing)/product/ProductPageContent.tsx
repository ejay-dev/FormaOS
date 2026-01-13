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
              Compliance infrastructure<br />
              <span className="relative">
                <span className="text-gradient">for regulated teams</span>
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
              Unify policies, evidence, tasks, and audit trails into a single defensible platform. Built for teams that need operational trust.
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
            badge="Platform Components"
            title={<>Six integrated modules<br className="hidden sm:inline" /><span className="text-gradient">for complete compliance</span></>}
            subtitle="Every component designed to work together for audit defense"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Policy Engine"
              description="Version-controlled policies with review cadence, ownership tracking, and staff acknowledgment workflows"
              delay={0}
            />
            <ValueProp
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Task Management"
              description="Turn controls into actionable tasks with due dates, assignees, and complete accountability chains"
              delay={0.1}
            />
            <ValueProp
              icon={<Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Evidence Vault"
              description="Secure artifact storage with approval workflows, control mapping, and audit-ready organization"
              delay={0.2}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Audit Trail"
              description="Immutable logs of all evidence decisions, task completions, and control evaluations for defensible records"
              delay={0.3}
            />
            <ValueProp
              icon={<TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Framework Alignment"
              description="Map requirements to compliance frameworks, score posture, and generate comprehensive audit exports"
              delay={0.4}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Reporting Engine"
              description="Executive dashboards, risk summaries, and compliance readiness reports generated in minutes"
              delay={0.5}
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
            badge="Integrated Workflow"
            title={<>From policy to evidence<br className="hidden sm:inline" /><span className="text-gradient">in one connected system</span></>}
            subtitle="See how FormaOS components work together for complete compliance coverage"
            alignment="center"
          />

          <div className="space-y-8 sm:space-y-12">
            <TimelineItem 
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Create & Manage Policies"
              description="Start with version-controlled policies that define your compliance requirements. Set review schedules, assign owners, and track staff acknowledgments."
              delay={0.1}
            />
            
            <TimelineItem 
              icon={<Target className="h-6 w-6 text-primary" />}
              title="Generate Control Tasks"
              description="Transform policy requirements into actionable tasks with clear ownership, due dates, and accountability chains."
              delay={0.2}
              position="left"
            />
            
            <TimelineItem 
              icon={<Database className="h-6 w-6 text-primary" />}
              title="Collect & Store Evidence"
              description="Capture evidence artifacts with approval workflows and automatic mapping to related controls and policies."
              delay={0.3}
            />
            
            <TimelineItem 
              icon={<Shield className="h-6 w-6 text-primary" />}
              title="Build Audit Trail"
              description="Every action creates immutable audit logs that provide complete traceability from policy to evidence."
              delay={0.4}
              position="left"
            />
            
            <TimelineItem 
              icon={<TrendingUp className="h-6 w-6 text-primary" />}
              title="Generate Reports"
              description="Produce comprehensive compliance reports, framework mappings, and executive dashboards in minutes."
              delay={0.5}
            />
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
            badge="Platform Features"
            title={<>Built for audit defense<br className="hidden sm:inline" /><span className="text-gradient">and operational trust</span></>}
            subtitle="Enterprise-grade features designed for regulated environments"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Version Control & Change Management</h3>
                  <p className="text-foreground/80">Track all policy changes with approval workflows, audit trails, and rollback capabilities.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Role-Based Access Control</h3>
                  <p className="text-foreground/80">Granular permissions ensure the right people have access to the right information.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Automated Notifications</h3>
                  <p className="text-foreground/80">Stay on top of deadlines with intelligent alerts for tasks, reviews, and compliance activities.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Integration Capabilities</h3>
                  <p className="text-foreground/80">Connect with your existing tools through APIs and pre-built integrations.</p>
                </div>
              </div>
            </div>
            
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.15)"
              className="h-fit"
            >
              <div className="text-center">
                <h4 className="text-xl font-bold mb-4">See FormaOS in action</h4>
                <p className="text-foreground/80 mb-6">
                  Get a personalized demo tailored to your compliance requirements.
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

      {/* Final CTA */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <MarketingAnchor 
          title="Ready to streamline compliance?"
          subtitle="Start your free trial and experience the complete FormaOS platform"
          badge="Get Started"
        />
      </CinematicSection>
    </div>
  );
}