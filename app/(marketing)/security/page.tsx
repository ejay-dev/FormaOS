import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { SecurityContent } from "./SecurityContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Security & Compliance",
  description: "Understand FormaOS security architecture, audit logging, and compliance safeguards.",
  alternates: {
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    title: "FormaOS | Security & Compliance",
    description: "Security architecture, audit logging, and access control designed for regulated operations.",
    type: "website",
    url: `${siteUrl}/security`,
  },
};

const safeguards = [
  {
    title: "Tenant isolation",
    description: "Every record is scoped to an organization with strict RLS enforcement and access controls.",
  },
  {
    title: "Audit-grade logging",
    description: "Immutable audit events capture who did what, when, and why across compliance actions.",
  },
  {
    title: "Role-based access",
    description: "Granular permissions with segregation of duties protect approvals and exports.",
  },
  {
    title: "Evidence traceability",
    description: "Evidence links to controls, tasks, and approvals to maintain a verifiable chain of custody.",
  },
  {
    title: "Exportable audit bundles",
    description: "Generate signed bundles with snapshots, controls, and evidence for external audits.",
  },
  {
    title: "Compliance gates",
    description: "Critical actions are blocked when required controls are unresolved or evidence is missing.",
  },
  {
    title: "Evidence immutability",
    description: "Approvals, rejections, and changes are logged with before/after state for legal defensibility.",
  },
  {
    title: "Infrastructure posture",
    description: "Hosted on secure cloud infrastructure with private storage buckets and encrypted transport.",
  },
];

export default function SecurityPage() {
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
            Security & Compliance
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Built for<br />
            <span className="text-gradient">regulated environments</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            Audit-grade logging, tenant isolation, and compliance gates designed for organizations where security and data integrity are mandatory.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/auth/signup" className="btn btn-primary text-base px-8 py-4 shadow-premium-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="btn btn-secondary text-base px-8 py-4">
              Security Briefing
            </Link>
          </div>
        </div>
      </section>

      {/* Safeguards Grid */}
      <SecurityContent />
    </div>
  );
}
