"use client";

import Link from "next/link";
import { Target, Zap, Shield, TrendingUp, FileCheck, Database, Users, Lock, ArrowRight } from "lucide-react";
import {
  CinematicSection,
  SectionHeader,
  ProcessStep,
  ArchitectureCard,
  FeatureCard,
  VisualDivider,
  ParticleField,
  GradientMesh,
  InteractiveCard,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";

const lifecycle = [
  {
    number: 1,
    icon: Target,
    title: "Structure",
    description: "Model your organization, sites, and teams with clear control ownership and framework alignment.",
  },
  {
    number: 2,
    icon: Zap,
    title: "Execute",
    description: "Turn controls into tasks with due dates, assignees, and accountability chains.",
  },
  {
    number: 3,
    icon: Shield,
    title: "Prove",
    description: "Collect evidence and approvals with immutable audit logs and complete traceability.",
  },
  {
    number: 4,
    icon: TrendingUp,
    title: "Report",
    description: "Export audit bundles, readiness reports, and executive risk summaries in minutes.",
  },
];

const modules = {
  "Policy Engine": [
    "Version-controlled policy library",
    "Review cadence automation",
    "Staff acknowledgement tracking",
    "Approval workflow management"
  ],
  "Task System": [
    "Control-to-task mapping",
    "Assignment routing",
    "Deadline enforcement",
    "Remediation tracking"
  ],
  "Evidence Vault": [
    "Immutable artifact storage",
    "Approval chain history",
    "Control linkage",
    "Audit-ready indexing"
  ],
  "Audit Engine": [
    "Compliance posture scoring",
    "Gap analysis reports",
    "Export bundle generation",
    "Framework alignment views"
  ]
};

const workflows = [
  {
    icon: Shield,
    title: "NDIS audit preparation",
    description: "Map practice standards, assign tasks, collect evidence, generate certification bundles"
  },
  {
    icon: FileCheck,
    title: "Healthcare credential verification",
    description: "Track role requirements, flag expirations, maintain audit-ready access logs"
  },
  {
    icon: Database,
    title: "Multi-site governance",
    description: "Centralize controls, distribute tasks, aggregate compliance posture across locations"
  },
  {
    icon: TrendingUp,
    title: "Executive reporting",
    description: "Real-time dashboards, risk summaries, posture trends, remediation status"
  },
];

export function ProductContent() {
  return (
    <>
      {/* Compliance Lifecycle */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium background overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={30} 
            colors={["rgba(0, 212, 251, 0.4)", "rgba(139, 92, 246, 0.3)"]}
          />
        </div>
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Compliance Lifecycle"
            badgeIcon={<Target className="h-4 w-4 text-primary" />}
            title={<>A system designed for<br className="hidden sm:inline" /><span className="text-gradient">daily operations</span></>}
            subtitle="Transform compliance from quarterly burden into operational rhythm"
            alignment="center"
          />

          <div className="space-y-4 sm:space-y-6">
            {lifecycle.map((step, idx) => (
              <ProcessStep
                key={step.title}
                number={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
                delay={idx * 0.15}
                showConnector={idx < lifecycle.length - 1}
              />
            ))}
          </div>

          <FadeInView delay={0.8} className="text-center mt-10 sm:mt-12">
            <Link 
              href="/auth/signup" 
              className="group inline-flex items-center gap-2 btn btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-premium-lg"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </FadeInView>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Platform Modules */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Platform Modules"
            badgeIcon={<Database className="h-4 w-4 text-secondary" />}
            title={<>Everything you need<br className="hidden sm:inline" /><span className="text-gradient">in one connected system</span></>}
            subtitle="Modular architecture with deep integration across all compliance functions"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {Object.entries(modules).map(([title, components], idx) => (
              <ArchitectureCard
                key={title}
                title={title}
                components={components}
                icon={
                  idx === 0 ? FileCheck : 
                  idx === 1 ? Zap : 
                  idx === 2 ? Shield : 
                  TrendingUp
                }
                delay={idx * 0.15}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Real-world Workflows */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Example Workflows"
            badgeIcon={<Zap className="h-4 w-4 text-accent" />}
            title={<>Real-world<br className="hidden sm:inline" /><span className="text-gradient">compliance operations</span></>}
            subtitle="See how regulated teams use FormaOS for operational compliance"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {workflows.map((workflow, idx) => (
              <InteractiveCard
                key={workflow.title}
                delay={idx * 0.1}
                glowColor="rgba(20, 184, 166, 0.3)"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <workflow.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-2">{workflow.title}</h3>
                    <p className="text-foreground/70">{workflow.description}</p>
                  </div>
                </div>
              </InteractiveCard>
            ))}
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
        {/* Premium gradient mesh overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(0, 212, 251, 0.1)", "rgba(139, 92, 246, 0.1)", "rgba(20, 184, 166, 0.08)"]}
            className="opacity-60"
          />
        </div>
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <div className="glass-intense rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-premium-2xl relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
              
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                  Ready to transform<br />
                  <span className="text-gradient">your compliance operations?</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Start your 14-day free trial today. No payment details required.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link 
                    href="/auth/signup" 
                    className="group inline-flex items-center gap-2 btn btn-primary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/contact" 
                    className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                  >
                    Request Demo
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
