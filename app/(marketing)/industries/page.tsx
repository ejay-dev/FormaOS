import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Industries",
  description: "Compliance workflows tailored for regulated industries: NDIS, healthcare, aged care, and professional services.",
  alternates: {
    canonical: `${siteUrl}/industries`,
  },
  openGraph: {
    title: "FormaOS | Industries",
    description:
      "Compliance workflows tailored for NDIS, healthcare, aged care, childcare, and regulated services.",
    type: "website",
    url: `${siteUrl}/industries`,
  },
};

const industries = [
  {
    title: "NDIS and disability services",
    pain: "Audit preparation, incident management, worker screening, and evidence of service delivery.",
    solution:
      "FormaOS aligns practice standards to operational controls and builds an auditable evidence trail for certification.",
  },
  {
    title: "Healthcare and allied health",
    pain: "Credential oversight, privacy obligations, and quality assurance processes across clinicians.",
    solution:
      "Centralize credential evidence, policy sign-off, and audit readiness for healthcare compliance teams.",
  },
  {
    title: "Aged care",
    pain: "Continuous compliance against quality standards, documentation of care, and incident response proof.",
    solution:
      "Map aged care standards to tasks and evidence so governance teams can demonstrate compliance quickly.",
  },
  {
    title: "Childcare and early learning",
    pain: "Safeguarding requirements, staff clearance tracking, and evidence for regulatory reviews.",
    solution:
      "Track clearances, training, and incident evidence with audit-ready reporting for childcare regulators.",
  },
  {
    title: "Community services",
    pain: "Multiple program obligations, shared evidence, and funding compliance documentation.",
    solution:
      "Standardize controls across programs while maintaining evidence traceability and governance reporting.",
  },
  {
    title: "Regulated professional services",
    pain: "Multi-site governance, professional accreditation, and audit requirements with limited staff.",
    solution:
      "Provide a single compliance system across locations with clear accountability and reporting.",
  },
  {
    title: "Custom frameworks",
    pain: "Non-standard obligations or internal governance requirements with no clear tooling.",
    solution:
      "Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.",
  },
];

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr] mk-fade-up mk-parallax-slow">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Industries</div>
          <h1 className="text-4xl font-semibold font-[var(--font-display)]">Built for regulated operations.</h1>
          <p className="text-lg text-slate-300">
            FormaOS supports organizations that operate under formal standards and audits. Each industry pack maps to
            real compliance obligations, not generic workflows.
          </p>
        </div>
        <MarketingAnchor
          title="Industry Pack Layers"
          subtitle="Frameworks, evidence, and controls mapped per sector."
          badge="Sector readiness"
          accent="16 185 129"
        />
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2 mk-stagger mk-parallax-slow">
        {industries.map((industry) => (
          <div key={industry.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-100">{industry.title}</h2>
            <div className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Pain points</div>
            <p className="mt-2 text-sm text-slate-400">{industry.pain}</p>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">FormaOS response</div>
            <p className="mt-2 text-sm text-slate-300">{industry.solution}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 mk-card mk-tilt mk-depth-2 rounded-2xl p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Need a tailored framework?</div>
            <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">We configure FormaOS for your obligations.</h2>
            <p className="mt-2 text-sm text-slate-300">Tell us your framework requirements and we map controls, evidence, and reports.</p>
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
