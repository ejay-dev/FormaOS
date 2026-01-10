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
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr] mk-fade-up mk-parallax-slow">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">About</div>
          <h1 className="text-4xl font-semibold font-[var(--font-display)]">Built for teams accountable to regulators.</h1>
          <p className="text-lg text-slate-300">
            FormaOS exists to help regulated organizations operate with confidence. Compliance teams need more than
            spreadsheets and shared drives. They need a defensible system that proves governance, evidence, and oversight.
          </p>
        </div>
        <MarketingAnchor
          title="Governance Mission"
          subtitle="Operational clarity that stands up to audits and regulator scrutiny."
          badge="Our purpose"
          accent="56 189 248"
        />
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 mk-stagger mk-parallax-fast">
        <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Mission</h2>
          <p className="mt-2 text-sm text-slate-400">
            Deliver operational clarity for regulated industries by connecting controls, evidence, and accountability in
            a single compliance operating system.
          </p>
        </div>
        <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Why it matters</h2>
          <p className="mt-2 text-sm text-slate-400">
            Regulators expect defensible evidence, not just documentation. FormaOS provides the audit trail and proof
            required to protect leadership teams and their organizations.
          </p>
        </div>
      </section>

      <section className="mt-16 mk-card mk-tilt mk-depth-2 rounded-2xl p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Ready to talk?</div>
            <h2 className="mt-3 text-2xl font-semibold font-[var(--font-display)]">Let us show you the FormaOS command center.</h2>
            <p className="mt-2 text-sm text-slate-300">We work with regulated operators who need certainty and speed.</p>
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
