import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { SecurityContent } from "./SecurityContent";
import { SecurityHero } from "./SecurityHero";

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
      {/* Cinematic Hero */}
      <SecurityHero />

      {/* Safeguards Grid */}
      <SecurityContent />
    </div>
  );
}
