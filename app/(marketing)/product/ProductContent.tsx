"use client";

import Link from "next/link";
import { Target, Zap, Shield, TrendingUp, FileCheck, Database, ArrowRight } from "lucide-react";
import {
  SectionHeader,
  ProcessStep,
  ArchitectureCard,
  GradientMesh,
  SystemBackground,
  GlassCard,
  SectionGlow,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
import { motion } from "framer-motion";

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

export function ProductContent() {
  return (
    <div className="relative">
      {/* Compliance Lifecycle - Process variant */}
      <SystemBackground variant="process" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="cyan" intensity="medium" position="top" />
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Compliance Lifecycle"
            badgeIcon={<Target className="h-4 w-4 text-primary" />}
            title={<>A system designed for<br className="hidden sm:inline" /><span className="text-gradient-system">daily operations</span></>}
            subtitle="Transform compliance from quarterly burden into operational rhythm"
            alignment="center"
          />

          <div className="space-y-4 sm:space-y-6">
            {lifecycle.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                <ProcessStep
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  delay={0}
                  showConnector={idx < lifecycle.length - 1}
                />
              </motion.div>
            ))}
          </div>

          <FadeInView delay={0.8} className="text-center mt-10 sm:mt-12">
            <Link 
              href="/auth/signup" 
              className="group inline-flex items-center gap-2 btn btn-primary btn-premium text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-premium-lg"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </FadeInView>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Platform Modules - Metrics variant */}
      <SystemBackground variant="metrics" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="blue" intensity="medium" position="center" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Platform Modules"
            badgeIcon={<Database className="h-4 w-4 text-secondary" />}
            title={<>Everything you need<br className="hidden sm:inline" /><span className="text-gradient-system">in one connected system</span></>}
            subtitle="Modular architecture with deep integration across all compliance functions"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {Object.entries(modules).map(([title, components], idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="card-radial-glow section-metrics"
              >
                <ArchitectureCard
                  title={title}
                  components={components}
                  icon={
                    idx === 0 ? FileCheck : 
                    idx === 1 ? Zap : 
                    idx === 2 ? Shield : 
                    TrendingUp
                  }
                  delay={0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Real-world Workflows - Info variant */}
      <SystemBackground variant="info" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="purple" intensity="low" position="center" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Example Workflows"
            badgeIcon={<Zap className="h-4 w-4 text-accent" />}
            title={<>Real-world<br className="hidden sm:inline" /><span className="text-gradient-system">compliance operations</span></>}
            subtitle="See how regulated teams use FormaOS for operational compliance"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {workflows.map((workflow, idx) => (
              <motion.div
                key={workflow.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <GlassCard variant="default" className="p-6 sm:p-8 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <workflow.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-2">{workflow.title}</h3>
                      <p className="text-foreground/70">{workflow.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Final CTA - Process variant with high intensity */}
      <SystemBackground variant="process" intensity="high" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <GlassCard 
              variant="intense" 
              glow 
              glowColor="cyan" 
              className="p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <GradientMesh animate={true} />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                  Ready to transform<br />
                  <span className="text-gradient-system-animated">your compliance operations?</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Start your 14-day free trial today. No payment details required.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link 
                    href="/auth/signup" 
                    className="group inline-flex items-center gap-2 btn btn-primary btn-premium text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
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
            </GlassCard>
          </FadeInView>
        </div>
      </SystemBackground>
    </div>
  );
}
