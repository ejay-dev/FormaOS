"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  Activity,
  ClipboardCheck,
  Zap,
  Target,
  TrendingUp,
  FileCheck,
  Eye,
  Users,
  BarChart3,
} from "lucide-react";
import { 
  CinematicSection,
  SectionHeader,
  FeatureCard,
  MetricCard,
  ArchitectureCard,
  VisualDivider,
  ProcessStep
} from "@/components/motion";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/motion";
import { motion } from "framer-motion";

const lifecycle = [
  {
    icon: Target,
    title: "Model obligations",
    description: "Align frameworks, policies, and controls across every site and team.",
  },
  {
    icon: Zap,
    title: "Execute tasks",
    description: "Assign remediation work with owners, deadlines, and evidence requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Capture evidence",
    description: "Store approvals, artifacts, and audit history in a single chain of custody.",
  },
  {
    icon: TrendingUp,
    title: "Prove readiness",
    description: "Generate audit bundles, reports, and compliance posture in minutes.",
  },
];

const industries = [
  {
    icon: Activity,
    title: "NDIS & disability services",
    description: "Track practice standards, provider obligations, and incident reporting.",
  },
  {
    icon: ShieldCheck,
    title: "Healthcare providers",
    description: "Manage credentials, clinical governance, and audit readiness.",
  },
  {
    icon: Layers,
    title: "Aged care operators",
    description: "Keep evidence and policy reviews current across multiple sites.",
  },
  {
    icon: ClipboardCheck,
    title: "Community services",
    description: "Prove service quality and compliance across programs and teams.",
  },
];

const platformArchitecture = {
  "Compliance Engine": [
    "Framework modeling",
    "Control libraries",
    "Risk assessment",
    "Gap analysis"
  ],
  "Task System": [
    "Workflow automation",
    "Assignment routing",
    "Deadline tracking",
    "Remediation management"
  ],
  "Evidence Vault": [
    "Immutable storage",
    "Approval chains",
    "Artifact versioning",
    "Audit trails"
  ],
  "Reporting Engine": [
    "Executive dashboards",
    "Audit export bundles",
    "Posture scoring",
    "Compliance metrics"
  ]
};

const metrics = [
  { icon: ShieldCheck, value: "94%", label: "Avg. Posture Score", trend: "up" as const },
  { icon: Target, value: "127", label: "Active Controls", trend: "neutral" as const },
  { icon: Zap, value: "<2min", label: "Audit Export Time", trend: "neutral" as const },
  { icon: TrendingUp, value: "98%", label: "Task Completion", trend: "up" as const },
];

export function HomePageContent() {
  return (
    <>
      {/* Platform metrics showcase */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Live Platform Metrics"
            badgeIcon={<BarChart3 className="h-4 w-4 text-primary" />}
            title={<>Real-time compliance intelligence</>}
            subtitle="FormaOS tracks compliance posture across your entire organization in real-time"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => (
              <MetricCard
                key={metric.label}
                icon={metric.icon}
                value={metric.value}
                label={metric.label}
                trend={metric.trend}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Platform lifecycle - Process steps */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="The Complete System"
            badgeIcon={<Sparkles className="h-4 w-4 text-primary" />}
            title={<>Compliance lifecycle,<br /><span className="text-gradient">engineered end-to-end</span></>}
            subtitle="From framework alignment to audit export—every step connected, traced, and defensible"
            alignment="center"
          />

          <div className="space-y-6">
            {lifecycle.map((step, idx) => (
              <ProcessStep
                key={step.title}
                number={idx + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
                delay={idx * 0.15}
                showConnector={idx < lifecycle.length - 1}
              />
            ))}
          </div>

          <FadeInView delay={0.8} className="text-center mt-12">
            <Link href="/product" className="btn btn-primary text-lg px-10 py-5 shadow-premium-lg">
              Explore Platform Architecture
            </Link>
          </FadeInView>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Platform architecture - System components */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="accent"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="System Architecture"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>Built as infrastructure,<br /><span className="text-gradient">not a document manager</span></>}
            subtitle="FormaOS is a true operating system for compliance—with interconnected modules working as one platform"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(platformArchitecture).map(([title, components], idx) => (
              <ArchitectureCard
                key={title}
                title={title}
                components={components}
                icon={
                  idx === 0 ? Target : 
                  idx === 1 ? Zap : 
                  idx === 2 ? FileCheck : 
                  TrendingUp
                }
                delay={idx * 0.15}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Industries section - Feature cards */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Built for Regulated Industries"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>Compliance frameworks<br /><span className="text-gradient">that match your obligations</span></>}
            subtitle="Pre-configured for Australian health, disability, and community services"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry, idx) => (
              <FeatureCard
                key={industry.title}
                icon={industry.icon}
                title={industry.title}
                description={industry.description}
                delay={idx * 0.1}
                variant="default"
                accentColor="secondary"
              />
            ))}
          </div>

          <FadeInView delay={0.6} className="text-center mt-12">
            <Link href="/industries" className="btn btn-secondary text-lg px-10 py-5">
              Explore All Industries
            </Link>
          </FadeInView>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Security section - Feature cards */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="accent"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Enterprise Security"
            badgeIcon={<Lock className="h-4 w-4 text-accent" />}
            title={<>Built for<br /><span className="text-gradient">regulated environments</span></>}
            subtitle="Security architecture designed for organizations that answer to regulators"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: "Role-based access", description: "Segregation of duties enforced at every level" },
              { icon: ShieldCheck, title: "Immutable logs", description: "Evidence traceability for audit defense" },
              { icon: Layers, title: "Org-scoped isolation", description: "Data isolation for every tenant" },
              { icon: Activity, title: "Compliance gates", description: "Block unsafe actions automatically" },
              { icon: Eye, title: "Audit trails", description: "Complete history of all compliance actions" },
              { icon: FileCheck, title: "Evidence chain", description: "Verifiable custody from creation to export" },
            ].map((point, idx) => (
              <FeatureCard
                key={point.title}
                icon={point.icon}
                title={point.title}
                description={point.description}
                delay={idx * 0.1}
                variant="frosted"
                accentColor="accent"
              />
            ))}
          </div>

          <FadeInView delay={0.7} className="text-center mt-12">
            <Link href="/security" className="btn btn-ghost text-lg px-10 py-5">
              Security Architecture →
            </Link>
          </FadeInView>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Final CTA section */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <div className="glass-intense rounded-3xl p-12 sm:p-16 lg:p-20 text-center shadow-premium-2xl relative overflow-hidden">
              <div className="absolute inset-0 command-grid opacity-20" />
              <div className="absolute inset-0 shimmer" />
              
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 glass-panel rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wider mb-8"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  Start Your Trial
                </motion.div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
                  Ready to operate with<br className="hidden sm:block" />
                  <span className="text-gradient">complete governance clarity?</span>
                </h2>
                
                <p className="text-xl text-foreground/70 mb-12 max-w-3xl mx-auto">
                  Start your 14-day free trial. No credit card required. Full platform access.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/auth/signup" className="btn btn-primary text-lg px-12 py-6 shadow-premium-xl">
                    Start Free Trial
                  </Link>
                  <Link href="/contact" className="btn btn-secondary text-lg px-12 py-6">
                    Request Demo
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Full access</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </CinematicSection>
    </>
  );
}

