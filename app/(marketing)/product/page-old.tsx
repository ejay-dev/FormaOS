import type { Metadata } from "next";
import { MarketingAnchor } from "../components/marketing-anchor";
import { Target, Zap, Shield, TrendingUp } from "lucide-react";
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