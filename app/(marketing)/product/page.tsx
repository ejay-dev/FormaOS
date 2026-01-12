import type { Metadata } from "next";
import Link from "next/link";
import { ProductContent } from "./ProductContent";
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
      {/* Cinematic Hero */}
      <ProductHero />

      <ProductContent />
    </div>
  );
}
