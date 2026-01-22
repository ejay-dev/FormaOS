"use client";

import Link from "next/link";
import { Database, Target, Users, Shield, Sparkles, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
  CinematicSection,
  SectionHeader,
  TimelineItem,
  NarrativeBlock,
  MissionStatement,
  TeamMember,
  VisualDivider,
  ValueProp,
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
  GradientMesh,
  InteractiveCard,
} from "@/components/motion";
import { MarketingAnchor } from "./marketing-anchor";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


function SimpleHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <AnimatedSystemGrid />
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
              <Link href={`${appBase}/auth/signup`} className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
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

function SimpleContent() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Complete Compliance Platform
          </h2>
          <p className="text-lg text-foreground/70">
            FormaOS provides end-to-end compliance management
          </p>
        </div>
        
        {/* Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: "94%", label: "Avg. Posture Score" },
            { value: "127", label: "Active Controls" },
            { value: "<2min", label: "Audit Export Time" },
            { value: "98%", label: "Task Completion" },
          ].map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {metric.value}
              </div>
              <div className="text-sm text-foreground/70">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Policy Engine",
              description: "Version-controlled policies with review cadence, ownership, and staff acknowledgement tracking.",
            },
            {
              title: "Task Management", 
              description: "Turn controls into tasks with due dates, assignees, and accountability chains.",
            },
            {
              title: "Evidence Vault",
              description: "Store artifacts with approval history, mapped controls, and audit-ready context.",
            },
            {
              title: "Audit Trail",
              description: "Immutable logs of evidence decisions, task completion, and control evaluations.",
            },
            {
              title: "Compliance Frameworks",
              description: "Align requirements to frameworks, score posture, and generate audit exports.",
            },
            {
              title: "Reporting Engine",
              description: "Executive dashboards, risk summaries, and readiness reports in minutes.",
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-background border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-foreground/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <MarketingAnchor 
        title="Ready to transform compliance?"
        subtitle="Start your free trial and see FormaOS in action"
        badge="Get Started"
      />
    </section>
  );
}

export function HomePageClient() {
  return (
    <div>
      <SimpleHero />
      <SimpleContent />
    </div>
  );
}