"use client";

import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { 
  SectionHeader,
  ExecutiveContactForm,
  ContactOptionsGrid,
  SuccessMessage,
  ErrorMessage,
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
  SystemBackground,
  GlassCard,
  SectionGlow,
} from "@/components/motion";

export function ContactHero({ status }: { status: "success" | "error" | null }) {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <AnimatedSystemGrid />
      </div>
      
      {/* Pulsing nodes - hidden on mobile */}
      {/* <div className="hidden sm:block">
        <PulsingNode x="8%" y="18%" delay={0} color="rgb(6, 182, 212)" />
        <PulsingNode x="92%" y="28%" delay={0.5} />
        <PulsingNode x="14%" y="72%" delay={1} />
        <PulsingNode x="86%" y="82%" delay={1.5} color="rgb(139, 92, 246)" />
      </div> */}
      
      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-accent/20 blur-[60px] sm:blur-[120px]" />
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
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-system rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-accent/30"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              </motion.div>
              Get in Touch
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Ready to build<br />
              <span className="relative">
                <span className="text-gradient-system-animated">operational trust?</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-[rgb(139,92,246)] via-[rgb(0,180,220)] to-[rgb(59,130,246)] rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8"
            >
              Whether you're a compliance leader, operations director, or CEO, let's discuss how FormaOS can help your team move from reactive compliance to proactive operational trust.
            </motion.p>

            {/* Status messages */}
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SuccessMessage />
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ErrorMessage />
              </motion.div>
            )}
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

// System-themed divider
function SystemDivider() {
  return (
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="relative h-px w-full"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)"
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-[rgba(0,180,220,0.2)] blur-xl" />
    </motion.div>
  );
}

export function ContactContent({ action }: { action: any }) {
  return (
    <div className="relative">
      {/* Contact options grid - Metrics variant */}
      <SystemBackground variant="metrics" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="cyan" intensity="medium" position="top" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Contact Options"
            title={<>Multiple ways to<br className="hidden sm:inline" /><span className="text-gradient-system">reach our team</span></>}
            subtitle="Choose the contact method that works best for you"
            alignment="center"
          />

          <ContactOptionsGrid />
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Contact form section - Process variant */}
      <SystemBackground variant="process" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="blue" intensity="high" position="center" />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Send us a message"
            title={<>Request a demo or<br className="hidden sm:inline" /><span className="text-gradient-system">schedule a consultation</span></>}
            subtitle="Fill out the form below and we'll get back to you within one business day"
            alignment="center"
          />

          <ExecutiveContactForm action={action} />
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Additional info - Info variant */}
      <SystemBackground variant="info" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="purple" intensity="low" position="center" />
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="What to Expect"
            title={<>Our response process</>}
            alignment="center"
          />

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard variant="default" glow glowColor="cyan" className="p-6 sm:p-8 h-full">
                <div className="text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full glass-system flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-system-cyan">
                    <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3">Submit your request</h3>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                    Fill out the contact form with your organization details and compliance needs
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard variant="default" glow glowColor="blue" className="p-6 sm:p-8 h-full">
                <div className="text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full glass-system flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-system-blue">
                    <span className="text-xl sm:text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3">Review & response</h3>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                    Our compliance specialists review your requirements and prepare a tailored response
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard variant="default" glow glowColor="purple" className="p-6 sm:p-8 h-full">
                <div className="text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full glass-system flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-system-purple">
                    <span className="text-xl sm:text-2xl font-bold text-accent">3</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3">Schedule a call</h3>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                    We'll schedule a demo call to walk through FormaOS and answer your questions
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </SystemBackground>
    </div>
  );
}
