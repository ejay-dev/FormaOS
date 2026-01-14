"use client";

import Link from "next/link";
import { Shield, Lock, Users, Database, FileCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ValueProp,
  VisualDivider,
  GradientMesh,
} from "@/components/motion";
import { CleanSystemGrid, PulsingNode, ParallaxLayer } from "@/components/motion/CleanBackground";

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
              Security Built Into<br />
              <span className="relative">
                <span className="text-gradient">the Operating Model</span>
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
              FormaOS is designed for organizations that require secure, verifiable, and auditable systems.
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
                Request Security Overview <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Security Architecture */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-12 sm:py-16 lg:py-20 relative"
      >
        {/* Premium security background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/3" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 via-transparent to-violet-50/10" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Security Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80">
              <Shield className="h-3 w-3" />
              Security Architecture
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              Security is embedded<br className="hidden sm:inline" />
              <span className="text-gradient">at every layer of the platform</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Security Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                    Enterprise-grade protection across infrastructure, application, and data layers
                  </p>
                </div>
              </div>
              
              {/* Security Layers Grid */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
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
                      End-to-end encryption at rest and in transit with enterprise key management
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      Role-Based Access Control
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Granular permissions and multi-factor authentication with zero-trust principles
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Database className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-green-600 transition-colors duration-300">
                      Multi-Tenant Isolation
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete tenant isolation for multi-organization environments with secure data boundaries
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
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Shield className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-base mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      Immutable Audit Logging
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Tamper-proof audit trails with cryptographic verification for regulatory compliance
                    </p>
                  </motion.div>
                </div>
                
                {/* Security Certifications */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-6">
                      Security Standards & Compliance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">SOC 2</div>
                        <div className="text-xs text-foreground/60">Type II Certified</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">ISO 27001</div>
                        <div className="text-xs text-foreground/60">Information Security</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">GDPR</div>
                        <div className="text-xs text-foreground/60">Privacy Compliant</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gradient mb-1">AES 256</div>
                        <div className="text-xs text-foreground/60">Encryption Standard</div>
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
        className="py-12 sm:py-16 lg:py-20 relative"
      >
        {/* Premium evidence background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/10 via-background to-indigo-50/10" />
        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/[0.02] via-transparent to-primary/[0.02]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Evidence Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-secondary/80">
              <FileCheck className="h-3 w-3" />
              Evidence Integrity
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-5xl mx-auto">
              Every action, task, and evidence record is<br className="hidden sm:inline" />
              <span className="text-gradient">verifiable and traceable</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6" />
          </motion.div>

          {/* Premium Evidence Chain */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                    Complete traceability from action to audit with cryptographic verification
                  </p>
                </div>
              </div>
              
              {/* Evidence Properties Grid */}
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
                      Precision timestamps with blockchain-verified chronological integrity
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
                      Cryptographically signed by authenticated user with non-repudiation guarantees
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
                      Direct mapping to regulatory obligations with automated compliance verification
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
                      Immutable storage with cryptographic proofs for long-term regulatory compliance
                    </p>
                  </motion.div>
                </div>
                
                {/* Evidence Quality Metrics */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-6">
                      Evidence Quality Standards
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">100%</div>
                        <div className="text-xs text-foreground/60">Audit Traceability</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">0</div>
                        <div className="text-xs text-foreground/60">Data Loss Incidents</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">&lt;1s</div>
                        <div className="text-xs text-foreground/60">Evidence Retrieval</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient mb-1">99.99%</div>
                        <div className="text-xs text-foreground/60">System Uptime</div>
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
        className="py-12 sm:py-16 lg:py-20 relative"
      >
        {/* Premium compliance background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(139, 92, 246, 0.08)", "rgba(0, 212, 251, 0.06)", "rgba(20, 184, 166, 0.04)"]}
            className="opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/10 via-background to-cyan-50/10" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Enterprise Compliance Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6 text-accent/80">
              <Shield className="h-3 w-3" />
              Compliance by Design
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
              FormaOS is built to<br className="hidden sm:inline" />
              <span className="text-gradient">support regulatory scrutiny</span>
            </h2>
            
            <div className="w-16 h-0.5 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-8" />
            
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed font-medium">
              There is no hidden state. No untraceable action. No undocumented outcome.
            </p>
          </motion.div>

          {/* Premium Transparency Framework */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                    FormaOS operates under the principle that compliance systems must be fully transparent, 
                    auditable, and verifiable at all times. Every system component is designed for scrutiny.
                  </p>
                </div>
              </div>
              
              {/* Transparency Principles */}
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-cyan-600">∅</div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">
                      No Hidden State
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Every data point, process state, and system condition is visible and queryable through audit interfaces
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-violet-600">→</div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">
                      Traceable Actions
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Complete action lineage from user intent to system outcome with immutable proof chains
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <div className="text-2xl font-bold text-emerald-600">✓</div>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3">
                      Documented Outcomes
                    </h4>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Automatic documentation of all compliance outcomes with regulatory mapping and evidence
                    </p>
                  </motion.div>
                </div>
                
                {/* Design Philosophy Statement */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mt-12 pt-8 border-t border-white/10 text-center"
                >
                  <h4 className="text-lg font-bold mb-4">
                    Designed for Regulatory Confidence
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                    When auditors, regulators, or compliance teams examine FormaOS, they find a system that 
                    anticipates their questions and provides verifiable answers. This level of transparency 
                    is not an accident – it is the fundamental design principle of the platform.
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
        className="py-12 sm:py-16 lg:py-20 relative"
      >
        {/* Premium security CTA background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-background to-violet-900/10" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Premium Security CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-primary/80"
                  >
                    <Shield className="h-3 w-3" />
                    Security First
                  </motion.div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                  >
                    Security is not a feature.<br className="hidden sm:inline" />
                    <span className="text-gradient">It is the foundation of governance.</span>
                  </motion.h2>
                  
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
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
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-center lg:text-left"
                  >
                    <h3 className="text-xl sm:text-2xl font-bold mb-6">
                      Enterprise security meets compliance requirements
                    </h3>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-foreground/70">SOC 2 Type II and ISO 27001 certified infrastructure</span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-sm text-foreground/70">End-to-end encryption with enterprise key management</span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-sm text-foreground/70">Immutable audit trails with cryptographic verification</span>
                      </div>
                    </div>

                    <p className="text-base text-foreground/60 leading-relaxed">
                      Get a comprehensive security overview tailored to your compliance requirements and regulatory environment.
                    </p>
                  </motion.div>
                  
                  {/* Security CTA Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-center"
                  >
                    <div className="space-y-4 mb-8">
                      <Link 
                        href="/contact" 
                        className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
                      >
                        <span className="relative z-10">Request Security Overview</span>
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
                      SOC 2 compliant • GDPR ready • Enterprise security standards
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