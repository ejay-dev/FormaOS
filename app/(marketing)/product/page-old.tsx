import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { Target, Zap, Shield, TrendingUp, FileCheck, Database, ArrowRight, Layers } from "lucide-react";
import { ProductHero } from "./ProductHero";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Platform",
  description:
    "Understand how FormaOS connects tasks, evidence, audit trails, and compliance reporting for regulated operations.",
  alternates: {
    canonical: `${siteUrl}/product`,
  },
  openGraph: {
    title: "FormaOS | Platform",
    description:
      "See how FormaOS links policies, tasks, evidence, and audit readiness into a defensible compliance workflow.",
    type: "website",
    url: `${siteUrl}/product`,
  },
};

function ProductHero() {
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
                <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Platform Architecture
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Compliance Infrastructure<br />
              <span className="relative">
                <span className="text-gradient">Built for Audit Defense</span>
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
              Connect policies, tasks, evidence, and audit trails into a defensible compliance workflow. Built for organizations that answer to regulators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
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

const lifecycle = [
  {
    icon: Target,
    title: "Structure",
    description: "Model your organization, sites, and teams with clear control ownership and framework alignment.",
  },
  {
    icon: Zap,
    title: "Execute",
    description: "Turn controls into tasks with due dates, assignees, and accountability chains.",
  },
  {
    icon: Shield,
    title: "Prove",
    description: "Collect evidence and approvals with immutable audit logs and complete traceability.",
  },
  {
    icon: TrendingUp,
    title: "Report",
    description: "Export audit bundles, readiness reports, and executive risk summaries in minutes.",
  },
];

const modules = [
  {
    title: "Policy Engine",
    features: ["Version-controlled policy library", "Review cadence automation", "Staff acknowledgement tracking", "Approval workflow management"],
  },
  {
    title: "Task Management", 
    features: ["Control-to-task mapping", "Due date enforcement", "Assignee accountability", "Progress tracking"],
  },
  {
    title: "Evidence Vault",
    features: ["Document storage & versioning", "Approval workflow history", "Control mapping", "Audit-ready exports"],
  },
  {
    title: "Audit Trail",
    features: ["Immutable event logging", "Evidence decisions", "Task completion records", "Control evaluations"],
  },
  {
    title: "Compliance Frameworks",
    features: ["Framework alignment", "Posture scoring", "Gap identification", "Audit bundle generation"],
  },
  {
    title: "Reporting Engine",
    features: ["Executive dashboards", "Risk summaries", "Readiness reports", "Custom exports"],
  },
];

const workflows = [
  {
    title: "NDIS audit preparation",
    steps: [
      "Map NDIS practice standards to controls",
      "Assign remediation tasks and due dates", 
      "Collect evidence from service delivery teams",
      "Generate an audit bundle for certification",
    ],
  },
  {
    title: "Healthcare credential verification",
    steps: [
      "Capture credential requirements per role",
      "Collect documents and approvals",
      "Flag missing or expiring credentials", 
      "Provide auditor-ready access logs",
    ],
  },
];

export default function ProductPage() {
  return (
    <div>
      <ProductHero />

      {/* Compliance Lifecycle */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Compliance Lifecycle</h2>
            <p className="text-lg text-muted-foreground">
              From framework mapping to audit defense - a complete workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {lifecycle.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section className="py-16 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Platform Modules</h2>
            <p className="text-lg text-muted-foreground">
              Integrated tools for end-to-end compliance management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">{module.title}</h3>
                <ul className="space-y-2">
                  {module.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="text-sm text-foreground/80 flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Common Workflows</h2>
            <p className="text-lg text-muted-foreground">
              Real-world scenarios for regulated organizations
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {workflows.map((workflow, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-8">
                <h3 className="text-xl font-bold mb-6">{workflow.title}</h3>
                <div className="space-y-4">
                  {workflow.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {stepIdx + 1}
                      </span>
                      <p className="text-sm text-foreground/80">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingAnchor 
        title="Ready to see FormaOS in action?"
        subtitle="Request a demo tailored to your compliance requirements"
        badge="Platform Demo"
      />
    </div>
  );
}
