"use client";

import Link from "next/link";
import { Shield, Lock, Eye, FileCheck, Users, Database, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  InteractiveCard,
  GradientMesh,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";
import { MarketingAnchor } from "../components/marketing-anchor";

function SecurityHero() {
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
        <PulsingNode x="12%" y="20%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="88%" y="30%" delay={0.5} />
        <PulsingNode x="18%" y="80%" delay={1} />
        <PulsingNode x="82%" y="90%" delay={1.5} color="rgb(6, 182, 212)" />
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
              Security & Privacy
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Security infrastructure<br />
              <span className="relative">
                <span className="text-gradient">for regulated data</span>
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
              Enterprise-grade security with privacy by design. Built for organizations handling sensitive compliance and operational data.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Start Secure Trial
              </Link>
              <Link href="/contact" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Security Overview <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

export default function SecurityPageContent() {
  return (
    <div>
      <SecurityHero />

      <VisualDivider />

      {/* Data Protection */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Clean gradient background - NO motion elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/3" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Data Protection"
            title={<>Privacy by design<br className="hidden sm:inline" /><span className="text-gradient">in every layer</span></>}
            subtitle="Comprehensive data protection measures for regulated environments"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="End-to-End Encryption"
              description="AES-256 encryption for data at rest and in transit with hardware security module key management"
              delay={0}
            />
            <ValueProp
              icon={<Eye className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Zero Trust Architecture"
              description="Every access request verified with multi-factor authentication and device validation"
              delay={0.1}
            />
            <ValueProp
              icon={<FileCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Data Residency Control"
              description="Choose your data location with Australian hosting and compliance with local privacy laws"
              delay={0.2}
            />
            <ValueProp
              icon={<Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Role-Based Access"
              description="Granular permissions with principle of least privilege and automated access reviews"
              delay={0.3}
            />
            <ValueProp
              icon={<Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Backup & Recovery"
              description="Automated backups with point-in-time recovery and disaster recovery testing"
              delay={0.4}
            />
            <ValueProp
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Vulnerability Management"
              description="Continuous security scanning with automated patching and threat detection"
              delay={0.5}
            />
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Compliance Certifications */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Security Standards"
            title={<>Certified and audited<br className="hidden sm:inline" /><span className="text-gradient">security controls</span></>}
            subtitle="Meeting international standards for enterprise security and privacy"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">ISO 27001 Certified</h3>
                <p className="text-foreground/80">
                  Comprehensive information security management system with annual 
                  third-party audits and continuous improvement processes.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">SOC 2 Type II Compliance</h3>
                <p className="text-foreground/80">
                  Independently verified security controls for availability, 
                  confidentiality, and privacy of customer data.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Australian Privacy Principles</h3>
                <p className="text-foreground/80">
                  Full compliance with Privacy Act 1988 including data breach 
                  notification and consent management frameworks.
                </p>
              </div>
            </div>
            
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.15)"
              className="h-fit"
            >
              <div>
                <h4 className="text-lg sm:text-xl font-bold mb-4">Security Features:</h4>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Multi-factor authentication required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Single Sign-On (SSO) integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Real-time activity monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Automated security incident response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Regular penetration testing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>24/7 security operations center</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center justify-center w-full px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Security Assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Incident Response */}
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
            badge="Incident Response"
            title={<>24/7 security monitoring<br className="hidden sm:inline" /><span className="text-gradient">and rapid response</span></>}
            subtitle="Proactive threat detection with immediate response capabilities"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InteractiveCard 
              glowColor="rgba(139, 92, 246, 0.1)"
              className="text-center"
            >
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Detection</h3>
              <p className="text-sm text-foreground/80">
                Advanced threat detection with machine learning algorithms 
                monitoring for anomalous activity patterns.
              </p>
            </InteractiveCard>
            
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.1)"
              className="text-center"
            >
              <Eye className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Analysis</h3>
              <p className="text-sm text-foreground/80">
                Immediate threat classification and impact assessment 
                by security professionals within minutes of detection.
              </p>
            </InteractiveCard>
            
            <InteractiveCard 
              glowColor="rgba(20, 184, 166, 0.1)"
              className="text-center"
            >
              <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Response</h3>
              <p className="text-sm text-foreground/80">
                Automated containment measures with customer notification 
                and detailed incident reports within 4 hours.
              </p>
            </InteractiveCard>
          </div>

          <InteractiveCard 
            className="mt-12 text-center"
            glowColor="rgba(139, 92, 246, 0.2)"
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              Security is our foundation, not an afterthought
            </h3>
            <p className="text-base sm:text-lg text-foreground/70 max-w-3xl mx-auto">
              Every feature, every process, and every access point is designed with 
              security-first principles to protect your most sensitive compliance data.
            </p>
          </InteractiveCard>
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
          title="Ready for enterprise security?"
          subtitle="Experience FormaOS with confidence in our security infrastructure"
          badge="Secure Trial"
        />
      </CinematicSection>
    </div>
  );
}