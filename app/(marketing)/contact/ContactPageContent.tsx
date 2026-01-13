"use client";

import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  ExecutiveContactForm,
  ContactOptionsGrid,
  SuccessMessage,
  ErrorMessage,
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer
} from "@/components/motion";

export function ContactHero({ status }: { status: "success" | "error" | null }) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-60">
        <AnimatedSystemGrid />
      </div>
      
      {/* Pulsing nodes */}
      <PulsingNode x="8%" y="18%" delay={0} color="rgb(6, 182, 212)" />
      <PulsingNode x="92%" y="28%" delay={0.5} />
      <PulsingNode x="14%" y="72%" delay={1} />
      <PulsingNode x="86%" y="82%" delay={1.5} color="rgb(139, 92, 246)" />
      
      {/* Radial gradient overlays */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[80px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
        <ParallaxLayer speed={0.3}>
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 glass-intense rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider mb-8 border border-accent/30"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Mail className="h-4 w-4 text-accent" />
              </motion.div>
              Get in Touch
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6"
            >
              Let's discuss<br />
              <span className="relative">
                <span className="text-gradient">your compliance needs</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-secondary rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8"
            >
              Tell us about your organization, regulatory requirements, and audit timeline. 
              A compliance specialist will respond within one business day.
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

export function ContactContent({ action }: { action: any }) {
  return (
    <>
      {/* Contact options grid */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Contact Options"
            title={<>Multiple ways to<br /><span className="text-gradient">reach our team</span></>}
            subtitle="Choose the contact method that works best for you"
            alignment="center"
          />

          <ContactOptionsGrid />
        </div>
      </CinematicSection>

      {/* Contact form section */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Send us a message"
            title={<>Request a demo or<br /><span className="text-gradient">schedule a consultation</span></>}
            subtitle="Fill out the form below and we'll get back to you within one business day"
            alignment="center"
          />

          <ExecutiveContactForm action={action} />
        </div>
      </CinematicSection>

      {/* Additional info */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="accent"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="What to Expect"
            title={<>Our response process</>}
            alignment="center"
          />

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-full glass-intense flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold font-display mb-3">Submit your request</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Fill out the contact form with your organization details and compliance needs
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-full glass-intense flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold font-display mb-3">We review and respond</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                A compliance specialist reviews your request and responds within one business day
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-full glass-intense flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold font-display mb-3">Schedule a demo</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                If qualified, we'll schedule a live platform demo tailored to your requirements
              </p>
            </div>
          </div>
        </div>
      </CinematicSection>
    </>
  );
}
