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
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { 
  SectionHeader,
  FeatureCard,
  MetricCard,
  ArchitectureCard,
  ProcessStep,
  NodeWireShowcase,
  GradientMesh,
  SystemBackground,
  GlassCard,
  SectionGlow,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
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

// Enhanced Visual Divider with system theme
function SystemDivider() {
  return (
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="relative h-px w-full my-0"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)"
      }}
    >
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-[rgba(0,180,220,0.2)] blur-xl" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-[rgba(59,130,246,0.3)] blur-md" />
    </motion.div>
  );
}

export function HomePageContent() {
  return (
    <div className="relative">
      {/* ========================================
          SECTION 1: METRICS (variant: metrics)
          Soft radial glow, micro-particles, glass depth
          ======================================== */}
      <SystemBackground variant="metrics" className="py-20 sm:py-24 lg:py-32">
        {/* Radial glow behind section */}
        <SectionGlow color="cyan" intensity="medium" position="center" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Live Platform Metrics"
            badgeIcon={<BarChart3 className="h-4 w-4 text-primary" />}
            title={<>Real-time compliance intelligence</>}
            subtitle="FormaOS tracks compliance posture across your entire organization in real-time"
            alignment="center"
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="card-radial-glow section-metrics"
              >
                <MetricCard
                  icon={metric.icon}
                  value={metric.value}
                  label={metric.label}
                  trend={metric.trend}
                  delay={0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 2: CONNECTED SYSTEM (variant: process)
          Stronger node presence, directional flow
          ======================================== */}
      <SystemBackground variant="process" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="blue" intensity="high" position="top" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Connected System"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>Every module<br /><span className="text-gradient-system">connected and aware</span></>}
            subtitle="A compliance operating system where policies, controls, evidence, and audits work as one intelligent network"
            alignment="center"
          />

          <FadeInView delay={0.3}>
            <div className="flex justify-center">
              <GlassCard variant="elevated" glow glowColor="cyan" className="p-6 sm:p-8 lg:p-12 max-w-4xl w-full">
                <NodeWireShowcase className="py-4" />
              </GlassCard>
            </div>
          </FadeInView>

          <FadeInView delay={0.6} className="text-center mt-8 sm:mt-12">
            <p className="text-foreground/60 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
              Each node represents a core compliance function. Changes flow through the system—updating controls triggers evidence requirements, which cascade to audit readiness.
            </p>
            <Link href="/product" className="btn btn-secondary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center gap-2">
              Explore Platform Architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeInView>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 3: LIFECYCLE (variant: info)
          Minimal, calm, subtle breathing motion
          ======================================== */}
      <SystemBackground variant="info" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="purple" intensity="low" position="center" />
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="The Complete System"
            badgeIcon={<Sparkles className="h-4 w-4 text-primary" />}
            title={<>Compliance lifecycle,<br /><span className="text-gradient-system">engineered end-to-end</span></>}
            subtitle="From framework alignment to audit export—every step connected, traced, and defensible"
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
                  number={idx + 1}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  delay={0}
                  showConnector={idx < lifecycle.length - 1}
                />
              </motion.div>
            ))}
          </div>

          <FadeInView delay={0.8} className="text-center mt-10 sm:mt-14">
            <Link href="/product" className="btn btn-primary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 shadow-premium-lg">
              Explore Platform Architecture
            </Link>
          </FadeInView>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 4: ARCHITECTURE (variant: process)
          System components with data pathways
          ======================================== */}
      <SystemBackground variant="process" intensity="high" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="mixed" intensity="medium" position="top" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="System Architecture"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>Built as infrastructure,<br /><span className="text-gradient-system">not a document manager</span></>}
            subtitle="FormaOS is a true operating system for compliance—with interconnected modules working as one platform"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {Object.entries(platformArchitecture).map(([title, components], idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="card-radial-glow section-process"
              >
                <ArchitectureCard
                  title={title}
                  components={components}
                  icon={
                    idx === 0 ? Target : 
                    idx === 1 ? Zap : 
                    idx === 2 ? FileCheck : 
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

      {/* ========================================
          SECTION 5: INDUSTRIES (variant: info)
          Calm informational section
          ======================================== */}
      <SystemBackground variant="info" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="blue" intensity="low" position="center" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Built for Regulated Industries"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>Compliance frameworks<br /><span className="text-gradient-system">that match your obligations</span></>}
            subtitle="Pre-configured for Australian health, disability, and community services"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {industries.map((industry, idx) => (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <FeatureCard
                  icon={industry.icon}
                  title={industry.title}
                  description={industry.description}
                  delay={0}
                  variant="default"
                  accentColor="secondary"
                />
              </motion.div>
            ))}
          </div>

          <FadeInView delay={0.6} className="text-center mt-10 sm:mt-14">
            <Link href="/industries" className="btn btn-secondary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5">
              Explore All Industries
            </Link>
          </FadeInView>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 6: SECURITY (variant: metrics)
          Glass effects with soft glow
          ======================================== */}
      <SystemBackground variant="metrics" className="py-20 sm:py-24 lg:py-32">
        <SectionGlow color="purple" intensity="medium" position="center" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Enterprise Security"
            badgeIcon={<Lock className="h-4 w-4 text-accent" />}
            title={<>Built for<br /><span className="text-gradient-system">regulated environments</span></>}
            subtitle="Security architecture designed for organizations that answer to regulators"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Lock, title: "Role-based access", description: "Segregation of duties enforced at every level" },
              { icon: ShieldCheck, title: "Immutable logs", description: "Evidence traceability for audit defense" },
              { icon: Layers, title: "Org-scoped isolation", description: "Data isolation for every tenant" },
              { icon: Activity, title: "Compliance gates", description: "Block unsafe actions automatically" },
              { icon: Eye, title: "Audit trails", description: "Complete history of all compliance actions" },
              { icon: FileCheck, title: "Evidence chain", description: "Verifiable custody from creation to export" },
            ].map((point, idx) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="card-radial-glow section-metrics"
              >
                <FeatureCard
                  icon={point.icon}
                  title={point.title}
                  description={point.description}
                  delay={0}
                  variant="frosted"
                  accentColor="accent"
                />
              </motion.div>
            ))}
          </div>

          <FadeInView delay={0.7} className="text-center mt-10 sm:mt-14">
            <Link href="/security" className="btn btn-ghost text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center gap-2">
              Security Architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeInView>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 7: FINAL CTA (variant: process)
          Full visual intensity
          ======================================== */}
      <SystemBackground variant="process" intensity="high" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <GlassCard 
              variant="intense" 
              glow 
              glowColor="cyan" 
              className="p-8 sm:p-12 lg:p-16 xl:p-20 text-center relative overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 shimmer pointer-events-none" />
              
              {/* Gradient mesh overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <GradientMesh animate={true} />
              </div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 glass-system rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 sm:mb-8"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Start Your Trial
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-display mb-4 sm:mb-6">
                  Ready to operate with<br className="hidden sm:block" />
                  <span className="text-gradient-system-animated">complete governance clarity?</span>
                </h2>
                
                <p className="text-base sm:text-lg lg:text-xl text-foreground/70 mb-8 sm:mb-12 max-w-3xl mx-auto">
                  Start your 14-day free trial. No credit card required. Full platform access.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link href="/auth/signup" className="btn btn-primary btn-premium text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto">
                    Start Free Trial
                  </Link>
                  <Link href="/contact" className="btn btn-secondary text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto">
                    Request Demo
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ 
                        boxShadow: [
                          "0 0 8px rgba(0,180,220,0.5)",
                          "0 0 16px rgba(0,180,220,0.8)",
                          "0 0 8px rgba(0,180,220,0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ 
                        boxShadow: [
                          "0 0 8px rgba(0,180,220,0.5)",
                          "0 0 16px rgba(0,180,220,0.8)",
                          "0 0 8px rgba(0,180,220,0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ 
                        boxShadow: [
                          "0 0 8px rgba(0,180,220,0.5)",
                          "0 0 16px rgba(0,180,220,0.8)",
                          "0 0 8px rgba(0,180,220,0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                    <span>Full access</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </FadeInView>
        </div>
      </SystemBackground>
    </div>
  );
}

