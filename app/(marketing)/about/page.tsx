import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | About",
  description: "Why FormaOS exists and how it supports regulated organizations.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "FormaOS | About",
    description: "Why FormaOS exists and how it supports regulated organizations.",
    type: "website",
    url: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
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
            About FormaOS
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Built for teams<br />
            <span className="text-gradient">accountable to regulators</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            FormaOS exists to help regulated organizations operate with confidence. Compliance teams need more than spreadsheets—they need a defensible system that proves governance, evidence, and oversight.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/our-story" className="btn btn-primary text-base px-8 py-4 shadow-premium-lg">
              Read Our Story
            </Link>
            <Link href="/product" className="btn btn-secondary text-base px-8 py-4">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Purpose */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="card-hover glass-panel-strong rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-display">Mission</h2>
            <p className="text-[15px] text-foreground/80 leading-relaxed">
              Deliver operational clarity for regulated industries by connecting controls, evidence, and accountability in a single compliance operating system.
            </p>
          </div>
          <div className="card-hover glass-panel-strong rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-display">Why it matters</h2>
            <p className="text-[15px] text-foreground/80 leading-relaxed">
              Regulators expect defensible evidence, not just documentation. FormaOS provides the audit trail and proof required to protect leadership teams and their organizations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="card-hover glass-panel-strong rounded-2xl p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Ready to talk?</div>
              <h2 className="text-2xl md:text-3xl font-semibold font-display mb-3">Let us show you the FormaOS command center</h2>
              <p className="text-[15px] text-foreground/70 leading-relaxed">We work with regulated operators who need certainty and speed.</p>
            </div>
            <Link
              href="/contact"
              className="btn btn-primary text-base px-8 py-4 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
