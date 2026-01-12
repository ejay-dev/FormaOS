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
    price: "$230 AUD",
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
    href: "/contact",
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 pt-20 md:pt-32">
        {/* Ambient effects */}
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-secondary/6 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full glass-panel px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-8">
            Simple Pricing
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Plans built for<br />
            <span className="text-gradient">growing compliance teams</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-6">
            Choose the level of governance and support your organization requires. Start with a 14-day free trial—no payment details needed.
          </p>

          {/* Trial note */}
          <p className="text-sm text-muted-foreground mb-10">All pricing in AUD, billed monthly</p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/auth/signup" className="btn btn-primary text-base px-8 py-4 shadow-premium-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="btn btn-secondary text-base px-8 py-4">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, idx) => (
            <div 
              key={tier.name} 
              className={`card-hover rounded-2xl p-8 ${idx === 1 ? 'glass-panel-strong border-2 border-primary/20 shadow-premium-lg scale-105' : 'glass-panel'}`}
            >
              {idx === 1 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                  Most Popular
                </div>
              )}
              <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">{tier.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <div className="text-4xl md:text-5xl font-bold text-foreground font-display">{tier.price}</div>
                {tier.cadence && <div className="text-lg text-muted-foreground">{tier.cadence}</div>}
              </div>
              <p className="mt-4 text-[15px] text-foreground/80 leading-relaxed">{tier.summary}</p>
              <ul className="mt-6 space-y-3 text-[15px] text-foreground/80">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-8 inline-flex w-full justify-center rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                  idx === 1 
                    ? 'btn btn-primary shadow-premium-md' 
                    : 'btn btn-secondary'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="card-hover glass-panel-strong rounded-2xl p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Enterprise onboarding</div>
              <h2 className="text-2xl md:text-3xl font-semibold font-display mb-3">Need a tailored compliance program?</h2>
              <p className="text-[15px] text-foreground/70 leading-relaxed">
                We design onboarding and framework packs to match your regulatory requirements.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn btn-primary text-base px-8 py-4 whitespace-nowrap"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
