import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

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
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Security Safeguards
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Protection at every layer
          </h2>
          <p className="text-lg text-foreground/70">
            Eight security controls built into the platform foundation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {safeguards.map((item) => (
            <div key={item.title} className="card-hover glass-panel rounded-2xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-2 font-display">{item.title}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Access Control Philosophy */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Access control philosophy</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-hover glass-panel-strong rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-foreground mb-3 font-display">Segregation of duties</h3>
            <p className="text-[15px] text-foreground/70 leading-relaxed">
              Users cannot approve their own evidence or resolve their own compliance blocks. Approval workflows are
              enforced server-side and logged.
            </p>
          </div>
          <div className="card-hover glass-panel-strong rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-foreground mb-3 font-display">Audit-first design</h3>
            <p className="text-[15px] text-foreground/70 leading-relaxed">
              Every sensitive action records actor, role, entity scope, and evidence context to support regulator review.
            </p>
          </div>
        </div>
      </section>

      {/* Trust and Assurance CTA */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="card-hover glass-panel-strong rounded-2xl p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Trust and assurance</div>
              <h2 className="text-2xl md:text-3xl font-semibold font-display mb-3">Need a formal security review?</h2>
              <p className="text-[15px] text-foreground/70 leading-relaxed">
                We provide architecture briefings, audit evidence exports, and compliance documentation on request.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn btn-primary text-base px-8 py-4 whitespace-nowrap"
            >
              Contact Security Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
