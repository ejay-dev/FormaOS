"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle, Clock, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
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

function ContactHero() {
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
        <PulsingNode x="10%" y="20%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="90%" y="30%" delay={0.5} />
        <PulsingNode x="15%" y="80%" delay={1} />
        <PulsingNode x="85%" y="90%" delay={1.5} color="rgb(6, 182, 212)" />
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
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Get In Touch
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Ready to transform<br />
              <span className="relative">
                <span className="text-gradient">your compliance?</span>
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
              Get a personalized demo tailored to your industry. See how FormaOS can streamline your compliance workflows in minutes, not months.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link href="#demo-form" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Request Demo
              </Link>
              <Link href="#contact-info" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Contact Info <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

type ContactPageContentProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
  submitAction: (formData: FormData) => Promise<void>;
};

export default function ContactPageContent({ searchParams, submitAction }: ContactPageContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await submitAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <ContactHero />

      <VisualDivider />

      {/* Demo Request Form */}
      <section id="demo-form">
        <CinematicSection 
          backgroundType="gradient" 
          ambientColor="primary"
          className="py-16 sm:py-20 lg:py-32 relative"
        >
        {/* Clean gradient background - NO motion elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/3" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Request Demo"
            title={<>Get a personalized demo<br className="hidden sm:inline" /><span className="text-gradient">for your industry</span></>}
            subtitle="See FormaOS in action with a tailored demonstration of features relevant to your compliance needs"
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <InteractiveCard 
              glowColor="rgba(139, 92, 246, 0.15)"
              className="p-8"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-6">Book Your Demo</h3>
              
              <form action={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Your organization"
                    />
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium mb-2">
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="">Select industry</option>
                      <option value="ndis">NDIS Service Provider</option>
                      <option value="healthcare">Healthcare & Allied Health</option>
                      <option value="community">Community Services</option>
                      <option value="aged-care">Aged Care</option>
                      <option value="mental-health">Mental Health</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Tell us about your compliance needs
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="What compliance challenges are you facing? What frameworks do you need to meet?"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Request Demo <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {searchParams?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <p className="text-green-400 text-sm">
                    ✅ Thank you! We'll be in touch within 24 hours to schedule your demo.
                  </p>
                </motion.div>
              )}
              
              {searchParams?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm">
                    ❌ Something went wrong. Please try again or contact us directly.
                  </p>
                </motion.div>
              )}
            </InteractiveCard>

            {/* Demo Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">What to expect in your demo</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <h4 className="font-semibold text-sm">Industry-specific walkthrough</h4>
                      <p className="text-sm text-foreground/80">See FormaOS configured for your specific compliance requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <h4 className="font-semibold text-sm">Live Q&A with experts</h4>
                      <p className="text-sm text-foreground/80">Get answers about implementation, pricing, and integration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <h4 className="font-semibold text-sm">Custom implementation plan</h4>
                      <p className="text-sm text-foreground/80">Receive a tailored roadmap for your compliance transformation</p>
                    </div>
                  </div>
                </div>
              </div>

              <InteractiveCard 
                glowColor="rgba(0, 212, 251, 0.1)"
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">30-minute session</h4>
                </div>
                <p className="text-sm text-foreground/80 mb-4">
                  Focused demonstration covering the features most relevant to your compliance needs.
                </p>
                <div className="text-xs text-foreground/60">
                  Available Monday-Friday, 9 AM - 5 PM AEST
                </div>
              </InteractiveCard>
            </div>
          </div>
        </div>
      </CinematicSection>
      </section>

      <VisualDivider />

      {/* Contact Information */}
      <section id="contact-info">
        <CinematicSection 
          backgroundType="nodes" 
          ambientColor="secondary"
          className="py-16 sm:py-20 lg:py-32"
        >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Get In Touch"
            title={<>Multiple ways to<br className="hidden sm:inline" /><span className="text-gradient">connect with us</span></>}
            subtitle="Choose the communication method that works best for you"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ValueProp
              icon={<Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Email Support"
              description="Get detailed answers to your questions. We respond within 4 hours during business hours."
              delay={0}
            />
            <ValueProp
              icon={<Phone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Phone Support"
              description="Speak directly with our compliance experts for immediate assistance and consultation."
              delay={0.1}
            />
            <ValueProp
              icon={<MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Live Chat"
              description="Real-time support during business hours for quick questions and technical assistance."
              delay={0.2}
            />
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <InteractiveCard 
              glowColor="rgba(139, 92, 246, 0.1)"
              className="p-6 text-center"
            >
              <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Email</h3>
              <p className="text-sm text-foreground/80 mb-4">For detailed inquiries</p>
              <Link 
                href="mailto:hello@formaos.com.au" 
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                hello@formaos.com.au
              </Link>
            </InteractiveCard>
            
            <InteractiveCard 
              glowColor="rgba(0, 212, 251, 0.1)"
              className="p-6 text-center"
            >
              <Phone className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Phone</h3>
              <p className="text-sm text-foreground/80 mb-4">Business hours: 9 AM - 5 PM AEST</p>
              <Link 
                href="tel:+61-2-8123-4567" 
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                +61 2 8123 4567
              </Link>
            </InteractiveCard>
            
            <InteractiveCard 
              glowColor="rgba(20, 184, 166, 0.1)"
              className="p-6 text-center"
            >
              <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">Office</h3>
              <p className="text-sm text-foreground/80">
                Level 12, 1 Bligh Street<br />
                Sydney NSW 2000<br />
                Australia
              </p>
            </InteractiveCard>
          </div>
        </div>
      </CinematicSection>
      </section>

      <VisualDivider />

      {/* FAQ Section */}
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
            badge="Common Questions"
            title={<>Quick answers to<br className="hidden sm:inline" /><span className="text-gradient">your questions</span></>}
            subtitle="Can't find what you're looking for? Contact us directly."
            alignment="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">How long does implementation take?</h4>
                <p className="text-foreground/80 text-sm">
                  Most organizations are up and running within 2-4 weeks. Our onboarding team 
                  provides guided setup and training to ensure smooth adoption.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Do you provide data migration?</h4>
                <p className="text-foreground/80 text-sm">
                  Yes, we assist with migrating your existing policies, evidence, and compliance 
                  data. Our team handles the technical details while you focus on your operations.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">What frameworks do you support?</h4>
                <p className="text-foreground/80 text-sm">
                  We support NDIS Practice Standards, NSQHS, ISO 27001, SOC 2, and custom 
                  frameworks. New framework support can be added based on demand.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Is training included?</h4>
                <p className="text-foreground/80 text-sm">
                  All plans include comprehensive onboarding and user training. Professional 
                  and Enterprise plans include ongoing training sessions and dedicated support.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Can I integrate with existing tools?</h4>
                <p className="text-foreground/80 text-sm">
                  FormaOS offers API integration and pre-built connectors for common tools. 
                  Enterprise customers can request custom integrations.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">What about data security?</h4>
                <p className="text-foreground/80 text-sm">
                  Enterprise-grade security with AES-256 encryption, SOC 2 compliance, 
                  and Australian data residency. Full details available in our security overview.
                </p>
              </div>
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
          title="Ready to see FormaOS in action?"
          subtitle="Book your personalized demo and transform your compliance workflow"
          badge="Request Demo"
        />
      </CinematicSection>
    </div>
  );
}