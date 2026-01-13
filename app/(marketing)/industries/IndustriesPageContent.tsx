"use client";

import Link from "next/link";
import { Building2, Heart, Users, FileCheck, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  InteractiveCard,
  ParticleField,
  GradientMesh,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";
import { MarketingAnchor } from "../components/marketing-anchor";

function IndustriesHero() {
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
        <PulsingNode x="10%" y="25%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="90%" y="35%" delay={0.5} />
        <PulsingNode x="15%" y="75%" delay={1} />
        <PulsingNode x="85%" y="85%" delay={1.5} color="rgb(6, 182, 212)" />
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
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Industry Solutions
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Compliance built for<br />
              <span className="relative">
                <span className="text-gradient">regulated industries</span>
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
              Pre-built frameworks and workflows for NDIS providers, healthcare, and community services. Ready-to-deploy compliance infrastructure.
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

export default function IndustriesPageContent() {
  return (
    <div>
      <IndustriesHero />

      <VisualDivider />

      {/* NDIS Service Providers */}
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
            badge="NDIS Service Providers"
            title={<>Pre-built practice standards<br className="hidden sm:inline" /><span className="text-gradient">for audit readiness</span></>}
            subtitle="Complete workflows for NDIS Quality and Safeguarding Commission compliance"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<FileCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
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
              icon={<Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
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
              icon={<TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Continuous Improvement"
              description="Service review cycles, corrective action tracking, and quality improvement planning"
              delay={0.5}
            />
          </div>

          <InteractiveCard 
            className="mt-12 sm:mt-16"
            glowColor="rgba(139, 92, 246, 0.2)"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Ready for NDIS audits from day one</h3>
                <p className="text-foreground/80 mb-6">
                  Our NDIS framework comes with 200+ pre-built controls, evidence templates, 
                  and workflow automation that maps directly to NDIA requirements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    Book NDIS Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/auth/signup" className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary/20 text-foreground font-semibold hover:bg-primary/5 transition-colors">
                    Start Free Trial
                  </Link>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="font-semibold mb-4">Included NDIS Components:</h4>
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
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Healthcare & Allied Health"
            title={<>Integrated health service<br className="hidden sm:inline" /><span className="text-gradient">compliance frameworks</span></>}
            subtitle="AHPRA registration, clinical governance, and safety requirements in one system"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Clinical Governance</h3>
                <p className="text-foreground/80">
                  Evidence-based practice protocols, clinical incident management, 
                  and quality improvement frameworks aligned with NSQHS standards.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Professional Standards</h3>
                <p className="text-foreground/80">
                  AHPRA registration tracking, CPD management, and professional 
                  supervision documentation with automated compliance alerts.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Safety & Risk Management</h3>
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
                <h4 className="text-lg sm:text-xl font-bold mb-4">Healthcare Framework Includes:</h4>
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
            badge="Community Services"
            title={<>Standardized controls<br className="hidden sm:inline" /><span className="text-gradient">across all programs</span></>}
            subtitle="Maintain evidence traceability and governance reporting for diverse service delivery"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Program Governance</h3>
                <p className="text-foreground/80 mb-4">
                  Unified oversight across multiple programs with service-specific 
                  controls, outcome tracking, and stakeholder reporting.
                </p>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Service delivery framework alignment</li>
                  <li>• Outcome measurement and reporting</li>
                  <li>• Stakeholder engagement tracking</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Safety & Wellbeing</h3>
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
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Quality Assurance</h3>
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
                <h4 className="text-lg font-bold mb-3">Ready to streamline compliance?</h4>
                <p className="text-sm text-foreground/80 mb-4">
                  Get a demo tailored to your community services requirements.
                </p>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  Community Services Demo <ArrowRight className="ml-2 h-3 w-3" />
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
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        <MarketingAnchor 
          title="Ready for industry-specific compliance?"
          subtitle="Choose your framework and start with pre-built controls designed for your sector"
          badge="Get Started"
        />
      </CinematicSection>
    </div>
  );
}