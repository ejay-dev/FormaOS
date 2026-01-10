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
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr] mk-fade-up mk-parallax-slow">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Security</div>
          <h1 className="text-4xl font-semibold font-[var(--font-display)]">Security and compliance built in.</h1>
          <p className="text-lg text-slate-300">
            FormaOS is designed for regulated environments where audit integrity and data isolation are mandatory.
          </p>
        </div>
        <MarketingAnchor
          title="Security Control Plane"
          subtitle="Segregation of duties, compliance gates, and evidence immutability."
          badge="Security core"
          accent="56 189 248"
        />
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 mk-stagger mk-parallax-slow">
        {safeguards.map((item) => (
          <div key={item.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 mk-parallax-fast">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Access control philosophy</div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-100">Segregation of duties</h2>
            <p className="mt-2 text-sm text-slate-400">
              Users cannot approve their own evidence or resolve their own compliance blocks. Approval workflows are
              enforced server-side and logged.
            </p>
          </div>
          <div className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-100">Audit-first design</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every sensitive action records actor, role, entity scope, and evidence context to support regulator review.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 mk-card mk-tilt mk-depth-2 rounded-2xl p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Trust and assurance</div>
            <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">Need a formal security review?</h2>
            <p className="mt-2 text-sm text-slate-300">
              We provide architecture briefings, audit evidence exports, and compliance documentation on request.
            </p>
          </div>
          <Link
            href="/pricing"
            className="mk-cta inline-flex rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100"
          >
            View Plans
          </Link>
        </div>
      </section>
    </div>
  );
}
