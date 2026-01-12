import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { IndustriesContent } from "./IndustriesContent";

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
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 pt-20 md:pt-32">
        {/* Ambient effects */}
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-secondary/6 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full glass-panel px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-8">
            Industry Frameworks
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Built for your sector,<br />
            <span className="text-gradient">ready from day one</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            Pre-configured compliance frameworks for Australian health, disability, aged care, and community services. Get audit-ready faster with industry-specific controls.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/auth/signup" className="btn btn-primary text-base px-8 py-4 shadow-premium-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="btn btn-secondary text-base px-8 py-4">
              Talk to Specialist
            </Link>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <IndustriesContent />
    </div>
  );
}
