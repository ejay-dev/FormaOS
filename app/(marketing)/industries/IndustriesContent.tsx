"use client";

import { Activity, Shield, Heart, Users, Building, GraduationCap, Briefcase } from "lucide-react";
import {
  CinematicSection,
  SectionHeader,
  FeatureCard,
  VisualDivider,
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
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Regulated Industries"
            badgeIcon={<Shield className="h-4 w-4 text-primary" />}
            title={<>Pre-configured frameworks<br /><span className="text-gradient">for your sector</span></>}
            subtitle="FormaOS includes compliance frameworks tailored for Australian regulated industries"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, idx) => (
              <FeatureCard
                key={industry.title}
                icon={industry.icon}
                title={industry.title}
                description={industry.description}
                delay={idx * 0.1}
                variant="intense"
                accentColor={industry.color}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Problems & Solutions */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="How FormaOS Helps"
            title={<>From operational chaos<br /><span className="text-gradient">to audit-ready clarity</span></>}
            subtitle="See how FormaOS solves real compliance challenges across regulated industries"
            alignment="center"
          />

          <div className="space-y-8">
            {solutions.map((item, idx) => (
              <FadeInView key={idx} delay={idx * 0.1}>
                <div className="glass-panel-strong rounded-2xl p-8 lg:p-10 shadow-premium-lg">
                  <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-3">
                        Problem
                      </div>
                      <p className="text-lg text-foreground/80 leading-relaxed">
                        {item.problem}
                      </p>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full glass-intense flex items-center justify-center">
                        <span className="text-2xl">→</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">
                        FormaOS Solution
                      </div>
                      <p className="text-lg text-foreground/90 leading-relaxed font-medium">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
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
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <div className="glass-intense rounded-3xl p-12 sm:p-16 text-center shadow-premium-2xl relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 glass-panel rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wider mb-8">
                  <Briefcase className="h-5 w-5 text-accent" />
                  Custom Frameworks
                </div>

                <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6">
                  Non-standard obligations or<br />
                  <span className="text-gradient">internal governance requirements?</span>
                </h2>
                
                <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
                  Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/contact" className="btn btn-primary text-lg px-12 py-6 shadow-premium-xl">
                    Contact Sales
                  </Link>
                  <Link href="/product" className="btn btn-secondary text-lg px-12 py-6">
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
