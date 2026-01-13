"use client";

import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { 
  CinematicSection,
  SectionHeader,
  ExecutiveContactForm,
  ContactOptionsGrid,
  SuccessMessage,
  ErrorMessage
} from "@/components/motion";

export function ContactHero({ status }: { status: "success" | "error" | null }) {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Multi-layer background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 security-grid opacity-30" />
        <div className="absolute inset-0 vignette" />
      </div>

      {/* Ambient lights */}
      <div className="pointer-events-none absolute right-1/4 top-20 h-[600px] w-[600px] rounded-full bg-accent/8 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 bottom-20 h-[500px] w-[500px] rounded-full bg-primary/6 blur-3xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2.5 glass-panel rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider mb-8">
            <Mail className="h-4 w-4 text-primary" />
            Get in Touch
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Let's discuss<br />
            <span className="text-gradient">your compliance needs</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-8">
            Tell us about your organization, regulatory requirements, and audit timeline. 
            A compliance specialist will respond within one business day.
          </p>

          {/* Status messages */}
          {status === "success" && <SuccessMessage />}
          {status === "error" && <ErrorMessage />}
        </div>
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
