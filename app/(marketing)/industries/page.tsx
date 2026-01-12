import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { IndustriesContent } from "./IndustriesContent";
import { IndustriesHero } from "./IndustriesHero";

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
    <div>
      {/* Cinematic Hero */}
      <IndustriesHero />

      {/* Industries Grid */}
      <IndustriesContent />
    </div>
  );
}
