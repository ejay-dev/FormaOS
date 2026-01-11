import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
} from "lucide-react";
import { MarketingAnchor } from "./components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Enterprise Compliance Operating System",
  description:
    "FormaOS is the enterprise compliance operating system for regulated industries. Align controls, evidence, tasks, and audits in one command center.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "FormaOS | Enterprise Compliance Operating System",
    description:
      "Enterprise compliance platform for NDIS, healthcare, and regulated operations.",
    type: "website",
    url: siteUrl,
  },
};

const lifecycle = [
  {
    title: "Model obligations",
    description: "Align frameworks, policies, and controls across every site and team.",
  },
  {
    title: "Execute tasks",
    description: "Assign remediation work with owners, deadlines, and evidence requirements.",
  },
  {
    title: "Capture evidence",
    description: "Store approvals, artifacts, and audit history in a single chain of custody.",
  },
  {
    title: "Prove readiness",
    description: "Generate audit bundles, reports, and compliance posture in minutes.",
  },
];

const industries = [
  {
    title: "NDIS & disability services",
    description: "Track practice standards, provider obligations, and incident reporting.",
  },
  {
    title: "Healthcare providers",
    description: "Manage credentials, clinical governance, and audit readiness.",
  },
  {
    title: "Aged care operators",
    description: "Keep evidence and policy reviews current across multiple sites.",
  },
  {
    title: "Community services",
    description: "Prove service quality and compliance across programs and teams.",
  },
];

const securityPoints = [
  "Role-based access and segregation of duties",
  "Immutable audit logs and evidence traceability",
  "Org-scoped data isolation for every tenant",
  "Compliance gates that block unsafe actions",
];

const pricingPreview = [
  {
    title: "Starter",
    price: "$159 AUD",
    detail: "Core compliance engine for small teams.",
    href: "/auth/signup?plan=basic",
  },
  {
    title: "Pro",
    price: "$230 AUD",
    detail: "Advanced reporting and governance controls.",
    href: "/auth/signup?plan=pro",
  },
  {
    title: "Enterprise",
    price: "Custom",
    detail: "White-glove onboarding and custom frameworks.",
    href: "/contact",
  },
];

export default function MarketingHomePage() {
  return (
    <div>
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24 mk-parallax-slow">
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 top-32 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 mk-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-card-foreground/8 bg-card/5 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-muted">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Enterprise compliance operating system
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-slate-100 md:text-5xl font-[var(--font-display)]">
              FormaOS – Enterprise Compliance Operating System
            </h1>
            <p className="text-lg text-muted">
              FormaOS keeps regulated teams{" "}
              <span className="text-gradient text-glow-subtle">audit-ready</span>, every day. Align
              controls, evidence, and operational tasks in a single system of record built for NDIS,
              healthcare, and multi-site services.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/pricing"
                className="mk-cta rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
              >
                Start Trial / View Plans
              </Link>
              <Link
                href="/contact"
                className="mk-cta rounded-lg border border-card-foreground/8 px-6 py-3 text-sm font-semibold text-card-foreground hover:border-card-foreground/20"
              >
                Request Demo
              </Link>
              <Link href="/product" className="text-sm font-semibold text-slate-300 hover:text-slate-100">
                View Platform
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              <span className="rounded-full border border-card-foreground/8 bg-card/5 px-3 py-2">14-day free trial</span>
              <span className="rounded-full border border-card-foreground/8 bg-card/5 px-3 py-2">Audit-ready evidence</span>
              <span className="rounded-full border border-card-foreground/8 bg-card/5 px-3 py-2">Compliance gates</span>
            </div>
          </div>

          <div className="mk-card mk-hero-frame mk-tilt mk-depth-3 rounded-2xl p-6 mk-fade-up">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Command center preview</div>
            <div className="mt-6 space-y-4">
              <div className="mk-panel rounded-xl p-5 bg-card">
                  <div className="text-sm font-semibold text-card-foreground">Compliance posture</div>
                  <div className="mt-3 h-2 rounded-full bg-card/8">
                  <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-slate-300">
                    <div className="rounded-lg border border-card-foreground/8 bg-card p-3">Compliant</div>
                    <div className="rounded-lg border border-card-foreground/8 bg-card p-3">At risk</div>
                    <div className="rounded-lg border border-card-foreground/8 bg-card p-3">Non-compliant</div>
                </div>
              </div>
              <div className="mk-panel rounded-xl p-5">
                  <div className="text-sm font-semibold text-card-foreground">Evidence pipeline</div>
                  <div className="mt-4 space-y-3 text-xs text-muted">
                    <div className="flex items-center justify-between rounded-lg border border-card-foreground/8 bg-card p-3">
                    <span>Incident management policy</span>
                    <span>Approved</span>
                  </div>
                    <div className="flex items-center justify-between rounded-lg border border-card-foreground/8 bg-card p-3">
                    <span>Credential verification</span>
                    <span>Pending</span>
                  </div>
                </div>
              </div>
                <div className="mk-panel rounded-xl p-4 text-xs text-muted bg-card/5">
                Built for operational governance, audit defense, and executive visibility.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 mk-parallax-slow">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="mk-fade-up">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Command center</div>
            <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
              A spatial compliance console built for regulated teams.
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Visualize controls, evidence, and audit posture in a single operational surface. Every layer is
              connected to an accountable workflow.
            </p>
          </div>
          <div className="mk-fade-up">
            <MarketingAnchor
              title="FormaOS Command Center"
              subtitle="Layered governance panels with real-time control status."
              badge="Live posture"
              accent="56 189 248"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Platform overview</div>
          <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
            A structured compliance engine, not a task list.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mk-stagger mk-parallax-fast">
          {[
            {
              title: "Control intelligence",
              description:
                "Map obligations to controls, policies, and evidence with clear owners and review cadence.",
              icon: Layers,
            },
            {
              title: "Operational governance",
              description:
                "Turn requirements into tasks with due dates, escalation paths, and audit visibility.",
              icon: ClipboardCheck,
            },
            {
              title: "Evidence chain of custody",
              description:
                "Centralize artifacts, approvals, and verification history with immutable logs.",
              icon: Lock,
            },
            {
              title: "Executive readiness",
              description:
                "Surface posture, gaps, and risk drivers across every site and team.",
              icon: Activity,
            },
          ].map((card) => (
            <div key={card.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-slate-200">
                <card.icon className="h-5 w-5 text-sky-300" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">How it works</div>
          <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
            A compliance lifecycle you can run daily.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mk-stagger mk-parallax-fast">
          {lifecycle.map((step, index) => (
            <div key={step.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
              <div className="text-xs text-slate-500">Step {index + 1}</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Industries served</div>
          <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
            Built for regulated industries with complex obligations.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mk-stagger mk-parallax-slow">
          {industries.map((industry) => (
            <div key={industry.title} className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100">{industry.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{industry.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/industries" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100">
            Explore industry packs <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mk-fade-up">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Security posture</div>
            <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
              Compliance enforcement you can defend.
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              FormaOS is designed to stand up to audits and regulatory scrutiny with immutable logs,
              permissions, and traceable evidence.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {securityPoints.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6 mk-fade-up">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit readiness</div>
            <div className="mt-6 space-y-4">
              <div className="mk-panel rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-100">Compliance gates</div>
                <p className="mt-2 text-xs text-slate-400">
                  Export and certification actions are blocked unless controls are compliant.
                </p>
              </div>
              <div className="mk-panel rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-100">Evidence traceability</div>
                <p className="mt-2 text-xs text-slate-400">
                  Every artifact is linked to a control, reviewer, and timestamp.
                </p>
              </div>
              <div className="mk-panel rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-100">Audit bundle exports</div>
                <p className="mt-2 text-xs text-slate-400">
                  Generate structured audit packs with logs, evidence, and compliance snapshots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Pricing preview</div>
          <h2 className="mt-3 text-3xl font-semibold font-[var(--font-display)]">
            Start with a 14-day trial.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 mk-stagger mk-parallax-fast">
          {pricingPreview.map((plan) => (
            <div key={plan.title} className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400">{plan.title}</div>
              <div className="mt-4 text-3xl font-semibold text-slate-100">{plan.price}</div>
              <p className="mt-3 text-sm text-slate-400">{plan.detail}</p>
              <Link
                href={plan.href}
                className="mt-6 inline-flex w-full justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/15"
              >
                {plan.title === "Enterprise" ? "Contact Sales" : "Start Trial"}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 text-xs text-slate-400">No payment details required to begin a trial.</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 mk-parallax-slow">
        <div className="mk-card mk-tilt mk-depth-2 rounded-3xl p-10 mk-fade-up">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Ready to activate</div>
              <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">
                Move from compliance tracking to compliance enforcement.
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Start a trial or request a demo to see FormaOS in action for your organization.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="mk-cta rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
              >
                View Plans
              </Link>
              <Link
                href="/contact"
                className="mk-cta rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
