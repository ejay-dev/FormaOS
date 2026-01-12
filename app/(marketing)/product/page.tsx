import type { Metadata } from "next";
import Link from "next/link";
import { ProductContent } from "./ProductContent";

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

      <ProductContent />
    </div>
  );
}
