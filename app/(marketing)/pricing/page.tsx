import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Pricing",
  description: "Pricing tiers for FormaOS: Starter, Pro, and Enterprise compliance operations.",
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: "FormaOS | Pricing",
    description: "Transparent plans for compliance-focused teams and regulated operators.",
    type: "website",
    url: `${siteUrl}/pricing`,
  },
};

const tiers = [
  {
    name: "Starter",
    price: "$159 AUD",
    cadence: "/month",
    summary: "For small providers and solo operators running essential compliance workflows.",
    features: [
      "Core compliance engine",
      "Tasks and evidence management",
      "Audit logs",
      "Standard reporting",
      "14-day free trial",
    ],
    cta: "Start Trial",
    href: "/auth/signup?plan=basic",
  },
  {
    name: "Pro",
    price: "$239 AUD",
    cadence: "/month",
    summary: "For growing organizations operating across sites and teams.",
    features: [
      "Everything in Starter",
      "Advanced reporting",
      "Governance controls",
      "Operational dashboards",
      "Workflow automation",
      "14-day free trial",
    ],
    cta: "Start Trial",
    href: "/auth/signup?plan=pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    summary: "For organizations seeking full implementation and white-glove support.",
    features: [
      "White-glove onboarding",
      "Custom compliance frameworks",
      "Org-wide deployment",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/auth/signup?plan=enterprise",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="space-y-6 mk-fade-up mk-parallax-slow">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Pricing</div>
        <h1 className="text-4xl font-semibold font-[var(--font-display)]">Clear plans for regulated operations.</h1>
        <p className="text-lg text-slate-300">
          Choose the level of governance and support your organization requires. Starter and Pro include a 14-day
          free trial.
        </p>
        <p className="text-sm text-slate-400">No payment details are required to start a trial.</p>
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] mk-parallax-slow">
        <div className="mk-fade-up">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Billing enforcement</div>
          <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">
            Plans are enforced through compliance gates.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Trial access unlocks the core command center. When the trial ends, paid features remain blocked until
            checkout is complete.
          </p>
        </div>
        <MarketingAnchor
          title="Revenue Control Layer"
          subtitle="Entitlements, gates, and audit-grade billing logic."
          badge="Billing layer"
          accent="99 102 241"
        />
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3 mk-stagger mk-parallax-fast">
        {tiers.map((tier) => (
          <div key={tier.name} className="mk-card mk-tilt mk-depth-2 rounded-2xl p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">{tier.name}</div>
            <div className="mt-4 text-3xl font-semibold text-slate-100">{tier.price}</div>
            <div className="text-sm text-slate-400">{tier.cadence}</div>
            <p className="mt-4 text-sm text-slate-300">{tier.summary}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={tier.href}
              className="mk-cta mt-6 inline-flex w-full justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100"
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </section>
      <div className="mt-6 text-xs text-slate-400">
        Prices are listed in AUD and billed monthly. Enterprise pricing is provided on request.
      </div>

      <section className="mt-16 mk-card mk-tilt mk-depth-2 rounded-2xl p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Enterprise onboarding</div>
            <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">Need a tailored compliance program?</h2>
            <p className="mt-2 text-sm text-slate-300">
              We design onboarding and framework packs to match your regulatory requirements.
            </p>
          </div>
          <Link
            href="/contact"
            className="mk-cta inline-flex rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
