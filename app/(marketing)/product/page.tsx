import type { Metadata } from "next";
import Link from "next/link";

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
    title: "Structure",
    description: "Model your organization, sites, and teams with clear control ownership.",
  },
  {
    title: "Execute",
    description: "Turn controls into tasks with due dates, assignees, and accountability.",
  },
  {
    title: "Prove",
    description: "Collect evidence and approvals with immutable audit logs and traceability.",
  },
  {
    title: "Report",
    description: "Export audit bundles, readiness reports, and executive risk summaries.",
  },
];

const modules = [
  {
    title: "Policies",
    description:
      "Maintain approved policies with review cadence, ownership, and evidence that staff acknowledgements are current.",
  },
  {
    title: "Tasks",
    description:
      "Operationalize controls into tasks with due dates, assignees, and remediation tracking.",
  },
  {
    title: "Evidence Vault",
    description:
      "Store artifacts with approval history, mapped controls, and audit-ready context.",
  },
  {
    title: "Audit Trail",
    description:
      "Immutable logs of evidence decisions, task completion, and control evaluations.",
  },
  {
    title: "Compliance Frameworks",
    description:
      "Align requirements to frameworks, score posture, and generate audit exports.",
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
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 pt-20 md:pt-32">
        {/* Ambient effects */}
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-secondary/6 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full glass-panel px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-8">
            Platform Overview
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            How FormaOS works<br />
            <span className="text-gradient">end-to-end</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            A structured, auditable workflow where every task, evidence item, and decision connects back to a control and a framework.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/auth/signup" className="btn btn-primary text-base px-8 py-4 shadow-premium-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="btn btn-secondary text-base px-8 py-4">
              Request Demo
            </Link>
            <Link href="/pricing" className="btn btn-ghost text-base px-6 py-4">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Lifecycle Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Compliance Lifecycle
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            A system you can run daily
          </h2>
          <p className="text-lg text-foreground/70">
            FormaOS transforms compliance from a quarterly burden into an operational rhythm
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {lifecycle.map((step, index) => (
            <div key={step.title} className="card-hover glass-panel rounded-2xl p-7">
              <div className="inline-flex glass-panel rounded-lg px-3 py-1.5 text-xs font-bold text-primary mb-5">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-3 font-display">{step.title}</h3>
              <p className="text-[15px] text-foreground/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Platform Modules
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Everything you need to stay audit-ready
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div key={module.title} className="card-hover glass-panel-strong rounded-2xl p-7">
              <h3 className="text-xl font-semibold mb-3 font-display">{module.title}</h3>
              <p className="text-[15px] text-foreground/70 leading-relaxed">{module.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflows Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Example Workflows
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Real-world compliance operations
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {workflows.map((workflow) => (
            <div key={workflow.title} className="card-hover glass-panel rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6 font-display">{workflow.title}</h3>
              <div className="space-y-4">
                {workflow.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full glass-panel text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-[15px] text-foreground/80 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="card-hover glass-panel-strong rounded-2xl p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
            Ready to transform your compliance operations?
          </h2>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial today. No payment details required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="btn btn-primary text-base px-8 py-4 shadow-premium-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="btn btn-secondary text-base px-8 py-4"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
