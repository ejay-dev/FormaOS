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
import { HomeClientMarker } from "./components/home-client-marker";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


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
    href: `${appBase}/auth/signup?plan=basic`,
  },
  {
    title: "Pro",
    price: "$230 AUD",
    detail: "Advanced reporting and governance controls.",
    href: `${appBase}/auth/signup?plan=pro`,
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
    <div className="relative">
      <HomeClientMarker />

      {/* Hero section - Mobile-First Redesign */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-32 pt-16 sm:pt-24 lg:pt-32">
        {/* Ambient glow effects */}
        <div className="pointer-events-none absolute -right-20 sm:-right-32 top-10 sm:top-20 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 sm:-left-20 top-32 sm:top-40 h-56 w-56 sm:h-80 sm:w-80 rounded-full bg-secondary/8 blur-3xl" />
        
        {/* Hero content - Mobile-optimized layout */}
        <div className="relative">
          {/* Text content block */}
          <div className="mx-auto max-w-4xl text-center space-y-6 sm:space-y-8 mb-12 sm:mb-16 lg:mb-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full glass-panel px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Enterprise Grade Platform
            </div>

            {/* Main headline - Mobile optimized */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.1] sm:leading-[1.08] font-display tracking-tight px-2 sm:px-0">
              The Compliance<br className="hidden sm:block" /> Operating System<br />
              <span className="text-gradient">for Regulated Organizations</span>
            </h1>

            {/* Value proposition - Mobile friendly */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto px-2 sm:px-4">
              Audit readiness. Evidence traceability. Multi-entity governance. 
              All in one command center built for NDIS, healthcare, and compliance-driven operations.
            </p>

            {/* Primary CTA block - Always visible */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 px-4 sm:px-0">
              <Link 
                href={`${appBase}/auth/signup`} 
                className="w-full sm:w-auto btn btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-premium-xl font-semibold"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto btn btn-secondary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5"
              >
                Request Demo
              </Link>
            </div>

            {/* Trust indicators - Mobile stacked */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-4 sm:pt-6 px-4">
              <span className="glass-panel rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                ✓ 14-day free trial
              </span>
              <span className="glass-panel rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                ✓ No credit card
              </span>
              <span className="glass-panel rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                ✓ Audit-ready
              </span>
            </div>
          </div>

          {/* Visual elements - Floating UI panels showcase */}
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 px-2 sm:px-0">
              {/* Module card 1 - Compliance Dashboard */}
              <div className="card-hover glass-panel-strong rounded-2xl p-5 sm:p-6 shadow-premium-lg transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-primary/10 p-2.5 sm:p-3">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="text-sm sm:text-base font-semibold font-display">Compliance Dashboard</div>
                </div>
                <div className="space-y-3">
                  <div className="glass-panel rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                      <span className="text-muted-foreground">Posture Score</span>
                      <span className="font-bold text-primary">94%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-2 w-[94%] rounded-full gradient-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="glass-panel rounded-lg p-2 text-center">
                      <div className="font-bold text-primary">127</div>
                      <div className="text-muted-foreground">Controls</div>
                    </div>
                    <div className="glass-panel rounded-lg p-2 text-center">
                      <div className="font-bold text-foreground">8</div>
                      <div className="text-muted-foreground">At Risk</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module card 2 - Evidence Vault */}
              <div className="card-hover glass-panel-strong rounded-2xl p-5 sm:p-6 shadow-premium-lg transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-secondary/10 p-2.5 sm:p-3">
                    <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                  <div className="text-sm sm:text-base font-semibold font-display">Evidence Vault</div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between glass-panel rounded-lg p-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <span>Incident policy</span>
                    </div>
                    <span className="text-primary font-semibold">Approved</span>
                  </div>
                  <div className="flex items-center justify-between glass-panel rounded-lg p-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span>Staff credentials</span>
                    </div>
                    <span className="text-muted-foreground font-semibold">Review</span>
                  </div>
                  <div className="flex items-center justify-between glass-panel rounded-lg p-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-secondary" />
                      <span>Risk register</span>
                    </div>
                    <span className="text-secondary font-semibold">Current</span>
                  </div>
                </div>
              </div>

              {/* Module card 3 - Audit Readiness */}
              <div className="card-hover glass-panel-strong rounded-2xl p-5 sm:p-6 shadow-premium-lg transform hover:scale-105 transition-transform duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-accent/10 p-2.5 sm:p-3">
                    <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                  </div>
                  <div className="text-sm sm:text-base font-semibold font-display">Audit Readiness</div>
                </div>
                <div className="space-y-3">
                  <div className="glass-panel rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-3">Next Audit</div>
                    <div className="font-bold text-lg sm:text-xl mb-1">23 days</div>
                    <div className="text-xs text-muted-foreground">NDIS Practice Standards</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="glass-panel rounded-lg p-2 text-center">
                      <div className="font-bold text-primary">✓</div>
                      <div className="text-muted-foreground mt-1">Ready</div>
                    </div>
                    <div className="glass-panel rounded-lg p-2 text-center">
                      <div className="font-bold text-foreground">3</div>
                      <div className="text-muted-foreground mt-1">Pending</div>
                    </div>
                    <div className="glass-panel rounded-lg p-2 text-center">
                      <div className="font-bold text-muted-foreground">0</div>
                      <div className="text-muted-foreground mt-1">Blocked</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform tagline */}
            <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
              <div className="inline-flex glass-panel-strong rounded-2xl px-6 sm:px-8 py-4 sm:py-5 shadow-premium-md">
                <p className="text-sm sm:text-base text-foreground/90 font-medium">
                  <span className="text-gradient font-semibold">Operational governance</span> that stands up in audits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Platform Overview
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            A structured compliance engine,<br />not a task list
          </h2>
          <p className="text-lg text-foreground/70">
            FormaOS transforms obligations into enforceable controls with clear ownership and audit visibility
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Control Intelligence",
              description: "Map obligations to controls, policies, and evidence with clear owners and review cadence.",
              icon: Layers,
            },
            {
              title: "Operational Governance",
              description: "Turn requirements into tasks with due dates, escalation paths, and audit visibility.",
              icon: ClipboardCheck,
            },
            {
              title: "Evidence Chain of Custody",
              description: "Centralize artifacts, approvals, and verification history with immutable logs.",
              icon: Lock,
            },
            {
              title: "Executive Readiness",
              description: "Surface posture, gaps, and risk drivers across every site and team.",
              icon: Activity,
            },
          ].map((card) => (
            <div key={card.title} className="card-hover glass-panel-strong rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-panel rounded-lg p-2.5">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 font-display">{card.title}</h3>
              <p className="text-[15px] text-foreground/70 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance lifecycle */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            A compliance lifecycle you can run daily
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {lifecycle.map((step, index) => (
            <div key={step.title} className="card-hover glass-panel rounded-2xl p-7">
              <div className="inline-flex glass-panel rounded-lg px-3 py-1.5 text-xs font-bold text-primary mb-5">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-3 font-display">{step.title}</h3>
              <p className="text-[15px] text-foreground/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Industries Served
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Built for regulated industries<br />with complex obligations
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {industries.map((industry) => (
            <div key={industry.title} className="card-hover glass-panel-strong rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-4 font-display">{industry.title}</h3>
              <p className="text-[15px] text-foreground/70 leading-relaxed">{industry.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/industries" className="inline-flex items-center gap-2 text-base text-primary hover:text-primary/80 transition-colors font-medium">
            Explore industry packs <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Security section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] items-center">
          {/* Content */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Security Posture
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Compliance enforcement you can defend
            </h2>
            <p className="text-lg text-foreground/70 mb-8">
              FormaOS is designed to stand up to audits and regulatory scrutiny with immutable logs,
              permissions, and traceable evidence.
            </p>

            <ul className="space-y-4">
              {securityPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <div className="glass-panel rounded-lg p-2 mt-0.5">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[15px] leading-relaxed pt-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="card-hover glass-panel-strong rounded-2xl p-8 shadow-premium-xl">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-6">
              Audit Readiness
            </div>

            <div className="space-y-5">
              <div className="glass-panel rounded-xl p-6">
                <div className="text-base font-semibold mb-3">Compliance Gates</div>
                <p className="text-sm text-foreground/70">
                  Export and certification actions are blocked unless controls are compliant.
                </p>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <div className="text-base font-semibold mb-3">Evidence Traceability</div>
                <p className="text-sm text-foreground/70">
                  Every artifact is linked to a control, reviewer, and timestamp.
                </p>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <div className="text-base font-semibold mb-3">Audit Bundle Exports</div>
                <p className="text-sm text-foreground/70">
                  Generate structured audit packs with logs, evidence, and compliance snapshots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Pricing Preview
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Start with a 14-day trial
          </h2>
          <p className="text-lg text-foreground/70">
            No payment details required to begin
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricingPreview.map((plan) => (
            <div key={plan.title} className="card-hover glass-panel-strong rounded-2xl p-8 flex flex-col">
              <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-6">
                {plan.title}
              </div>
              <div className="text-5xl font-bold mb-4 font-display">{plan.price}</div>
              <p className="text-[15px] text-foreground/70 mb-8 flex-grow">{plan.detail}</p>
              <Link
                href={plan.href}
                className={plan.title === "Pro" ? "btn btn-primary w-full text-base py-4" : "btn btn-secondary w-full text-base py-4"}
              >
                {plan.title === "Enterprise" ? "Contact Sales" : "Start Trial"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-32">
        <div className="card glass-panel-strong rounded-3xl p-12 lg:p-16 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Ready to Activate
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display">
              Move from compliance tracking<br />to compliance enforcement
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Start a trial or request a demo to see FormaOS in action for your organization
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/pricing" className="btn btn-primary text-base px-10 py-4 shadow-premium-lg">
                View Plans
              </Link>
              <Link href="/contact" className="btn btn-secondary text-base px-10 py-4">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
