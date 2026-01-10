import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

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
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] mk-fade-up mk-parallax-slow">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Platform overview</div>
          <h1 className="text-4xl font-semibold font-[var(--font-display)]">How FormaOS works end-to-end.</h1>
          <p className="text-lg text-slate-300">
            FormaOS is designed for compliance operations teams who need a structured, auditable workflow. Every task,
            evidence item, and decision connects back to a control and a framework.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="mk-cta rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
            >
              Request Demo
            </Link>
            <Link
              href="/pricing"
              className="mk-cta rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100"
            >
              Continue to Plans
            </Link>
          </div>
        </div>
        <div className="mk-card mk-tilt mk-depth-3 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Compliance lifecycle</div>
          <div className="mt-6 space-y-4">
            {lifecycle.map((step, index) => (
              <div key={step.title} className="mk-card mk-tilt mk-depth-1 rounded-xl p-4">
                <div className="text-xs text-slate-400">Step {index + 1}</div>
                <div className="text-sm font-semibold text-slate-100">{step.title}</div>
                <p className="mt-1 text-xs text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] mk-parallax-slow">
        <div className="mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">System stack</div>
          <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">
            A layered compliance engine with depth and traceability.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Every module is designed as a surface in the command center, giving teams immediate visibility into
            obligations, evidence, and audit readiness.
          </p>
        </div>
        <div className="mk-fade-up">
          <MarketingAnchor
            title="Compliance Stack"
            subtitle="Policies, tasks, evidence, and audit snapshots in one view."
            badge="Module stack"
            accent="129 140 248"
          />
        </div>
      </section>

      <section className="mt-16 mk-parallax-fast">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Operational structure</div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-100">Multi-entity governance</h2>
            <p className="mt-2 text-sm text-slate-400">
              Track compliance by organization, business unit, site, or team. Executives can see rollups while managers
              focus on their operational scope.
            </p>
          </div>
          <div className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-100">Evidence to audit chain</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every artifact has a source, approval history, and control mapping. Audit exports reference immutable
              events for legal defensibility.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 mk-parallax-slow">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Platform modules</div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <div key={module.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-100">{module.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{module.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 mk-parallax-fast">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Example workflows</div>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {workflows.map((workflow) => (
            <div key={workflow.title} className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100">{workflow.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {workflow.steps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 mk-card mk-tilt mk-depth-2 rounded-2xl p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Next step</div>
            <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">See your compliance lifecycle mapped end-to-end.</h2>
            <p className="mt-2 text-sm text-slate-300">We will map your current obligations to controls and evidence workflows.</p>
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
