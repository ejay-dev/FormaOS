"use client";

import { Activity, Shield, Heart, Users, Building, GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import {
  CinematicSection,
  SectionHeader,
  FeatureCard,
  VisualDivider,
  ParticleField,
  GradientMesh,
  InteractiveCard,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
import Link from "next/link";

const industries = [
  {
    icon: Activity,
    title: "NDIS & disability services",
    description: "Practice standards alignment, incident management, worker screening, and service delivery evidence tracking",
    color: "primary" as const
  },
  {
    icon: Heart,
    title: "Healthcare providers",
    description: "Credential oversight, privacy obligations, clinical governance, and quality assurance across practitioners",
    color: "secondary" as const
  },
  {
    icon: Users,
    title: "Aged care operators",
    description: "Continuous compliance with quality standards, documentation of care, and incident response proof",
    color: "accent" as const
  },
  {
    icon: GraduationCap,
    title: "Childcare & early learning",
    description: "Safeguarding requirements, staff clearance tracking, and evidence for regulatory reviews",
    color: "primary" as const
  },
  {
    icon: Building,
    title: "Community services",
    description: "Multiple program obligations, shared evidence, and funding compliance documentation",
    color: "secondary" as const
  },
  {
    icon: Briefcase,
    title: "Professional services",
    description: "Multi-site governance, professional accreditation, and audit requirements with limited staff",
    color: "accent" as const
  },
];

const solutions = [
  {
    problem: "Audit preparation chaos",
    solution: "FormaOS aligns practice standards to operational controls and builds an auditable evidence trail for certification"
  },
  {
    problem: "Credential oversight complexity",
    solution: "Centralize credential evidence, policy sign-off, and audit readiness for healthcare compliance teams"
  },
  {
    problem: "Multi-site governance gaps",
    solution: "Map standards to tasks and evidence so governance teams can demonstrate compliance quickly"
  },
  {
    problem: "Safeguarding blind spots",
    solution: "Track clearances, training, and incident evidence with audit-ready reporting for regulators"
  },
  {
    problem: "Program compliance fragmentation",
    solution: "Standardize controls across programs while maintaining evidence traceability and governance reporting"
  },
  {
    problem: "Professional accreditation tracking",
    solution: "Provide a single compliance system across locations with clear accountability and reporting"
  },
];

export function IndustriesContent() {
  return (
    <>
      {/* Industries Grid */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium background overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={25} 
            colors={["rgba(0, 212, 251, 0.3)", "rgba(139, 92, 246, 0.25)"]}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Regulated Industries"
            badgeIcon={<Shield className="h-4 w-4 text-primary" />}
            title={<>Pre-configured frameworks<br className="hidden sm:inline" /><span className="text-gradient">for your sector</span></>}
            subtitle="FormaOS includes compliance frameworks tailored for Australian regulated industries"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {industries.map((industry, idx) => (
              <InteractiveCard
                key={industry.title}
                delay={idx * 0.1}
                glowColor={
                  industry.color === "primary" ? "rgba(0, 212, 251, 0.2)" :
                  industry.color === "secondary" ? "rgba(139, 92, 246, 0.2)" :
                  "rgba(20, 184, 166, 0.2)"
                }
              >
                <div className="flex flex-col items-start">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 ${
                    industry.color === "primary" ? "bg-primary/10 border border-primary/20" :
                    industry.color === "secondary" ? "bg-secondary/10 border border-secondary/20" :
                    "bg-accent/10 border border-accent/20"
                  }`}>
                    <industry.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${
                      industry.color === "primary" ? "text-primary" :
                      industry.color === "secondary" ? "text-secondary" :
                      "text-accent"
                    }`} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{industry.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{industry.description}</p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Problems & Solutions */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="How FormaOS Helps"
            title={<>From operational chaos<br className="hidden sm:inline" /><span className="text-gradient">to audit-ready clarity</span></>}
            subtitle="See how FormaOS solves real compliance challenges across regulated industries"
            alignment="center"
          />

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {solutions.map((item, idx) => (
              <FadeInView key={idx} delay={idx * 0.1}>
                <InteractiveCard 
                  glowColor="rgba(139, 92, 246, 0.15)"
                  className="shadow-premium-lg"
                >
                  <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 lg:gap-8 items-center">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-2 sm:mb-3">
                        Problem
                      </div>
                      <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
                        {item.problem}
                      </p>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full glass-intense flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2 sm:mb-3">
                        FormaOS Solution
                      </div>
                      <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-medium">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </InteractiveCard>
              </FadeInView>
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Custom Frameworks */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium gradient mesh overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(20, 184, 166, 0.08)", "rgba(0, 212, 251, 0.06)", "rgba(139, 92, 246, 0.04)"]}
            className="opacity-50"
          />
        </div>
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <div className="glass-intense rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-premium-2xl relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 sm:mb-8">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  Custom Frameworks
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                  Non-standard obligations or<br />
                  <span className="text-gradient">internal governance requirements?</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link 
                    href="/contact" 
                    className="group inline-flex items-center gap-2 btn btn-primary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                  >
                    Contact Sales
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/product" 
                    className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                  >
                    View Platform
                  </Link>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </CinematicSection>
    </>
  );
}
