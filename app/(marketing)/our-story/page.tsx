import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "Our Story | FormaOS",
  description:
    "Why FormaOS exists and how we are building a compliance operating system for regulated teams.",
  alternates: {
    canonical: `${siteUrl.replace(/\/$/, "")}/our-story`,
  },
  openGraph: {
    title: "Our Story | FormaOS",
    description:
      "Founder-led story of how FormaOS was built for regulated teams and audit-ready operations.",
    type: "article",
    url: `${siteUrl.replace(/\/$/, "")}/our-story`,
  },
};

export default function OurStoryPage() {
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
            Our Story
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Building infrastructure<br />
            <span className="text-gradient">for operational trust</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            FormaOS was built to solve a problem that too many regulated teams quietly live with every day: fragmented systems, manual audits, and operational chaos hidden behind spreadsheets.
          </p>
        </div>
      </section>

      {/* Story Content */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="space-y-16">
          {/* Where It Started */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              Where It Started
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <p>
                FormaOS began in Adelaide, South Australia, not in a boardroom—but inside real operational workflows.
              </p>
              <p>
                Healthcare providers, disability services, compliance-driven organizations and multi-site teams were drowning in:
              </p>
              <ul className="space-y-2 pl-6 list-disc text-foreground/70">
                <li>disconnected tools,</li>
                <li>duplicated reporting,</li>
                <li>audit preparation that stole weeks of productivity, and</li>
                <li>risk that only surfaced when it was already too late.</li>
              </ul>
              <p className="font-semibold text-foreground pt-4">Compliance was being treated as paperwork.</p>
              <p className="font-semibold text-foreground">But in reality, it is infrastructure.</p>
              <p className="text-lg text-foreground">So we set out to rebuild it properly.</p>
            </div>
          </div>

          {/* The Vision */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              The Vision
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <p className="text-lg text-foreground font-medium">We asked one fundamental question:</p>
              <p className="text-xl text-foreground font-semibold">
                What if compliance wasn't something you prepared for… but something you lived inside every day?
              </p>
              <p>FormaOS was designed as a true Compliance Operating System:</p>
              <ul className="space-y-2 pl-6 list-disc text-foreground/70">
                <li>not reminders,</li>
                <li>not document storage,</li>
                <li>but a system that aligns controls, evidence, tasks, governance, and accountability in one connected environment.</li>
              </ul>
              <p className="font-semibold text-foreground pt-4">An OS for regulated operations.</p>
              <p className="font-semibold text-foreground">A command center for audit-ready teams.</p>
            </div>
          </div>

          {/* What Makes FormaOS Different */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              What Makes FormaOS Different
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <p>FormaOS unifies what used to live in silos:</p>
              <ul className="space-y-2 pl-6 list-disc text-foreground/70">
                <li>Operational tasks</li>
                <li>Evidence & documentation</li>
                <li>Governance controls</li>
                <li>Audit readiness</li>
                <li>Executive oversight</li>
              </ul>
              <p className="pt-4">All inside a single, traceable, accountable system of record.</p>
              <div className="pt-4 space-y-2">
                <p className="text-foreground">No scattered tools.</p>
                <p className="text-foreground">No last-minute audit scrambles.</p>
                <p className="text-foreground">No blind spots.</p>
              </div>
              <p className="text-lg text-foreground font-semibold pt-4">Just clarity, structure, and confidence.</p>
            </div>
          </div>

          {/* Built for People Who Carry Responsibility */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              Built for People Who Carry Responsibility
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <p>We don't build for "users."</p>
              <p>We build for people who are responsible for:</p>
              <ul className="space-y-2 pl-6 list-disc text-foreground/70">
                <li>safety,</li>
                <li>compliance,</li>
                <li>outcomes,</li>
                <li>and trust.</li>
              </ul>
              <p className="pt-4">
                From NDIS providers to healthcare operators, multi-site organizations, and governance-driven enterprises — FormaOS is for teams who cannot afford mistakes.
              </p>
            </div>
          </div>

          {/* Leadership */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              Leadership
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <div className="mb-6">
                <p className="text-lg font-semibold text-foreground">Ejaz Hussain</p>
                <p className="text-muted-foreground">Chief Engineer, FormaOS</p>
                <p className="text-muted-foreground">Adelaide, South Australia</p>
              </div>
              <p className="text-foreground font-medium">FormaOS is engineered with one guiding principle:</p>
              <p className="text-lg text-foreground font-semibold">
                If systems shape behavior, then compliance systems must shape accountability.
              </p>
              <p className="pt-4">
                Every feature, workflow, and control inside FormaOS exists to make regulated operations not just compliant — but resilient, transparent, and future-proof.
              </p>
            </div>
          </div>

          {/* Our Commitment */}
          <div className="glass-panel-strong rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              Our Commitment
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-foreground/80 leading-relaxed">
              <p>We are not here to build software that looks impressive.</p>
              <p>
                We are here to build infrastructure that stands up in audits, scales with complexity, and protects the people who rely on it.
              </p>
              <p className="text-lg text-foreground font-semibold pt-4">FormaOS is not just a product.</p>
              <p className="text-lg text-foreground font-semibold">It is a framework for operational trust.</p>
            </div>
          </div>

          {/* Contact */}
          <div className="glass-panel rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-6">
              Contact
            </h2>
            <div className="space-y-3 text-[15px] md:text-base text-foreground/80">
              <p>📧 formaos.team@gmail.com</p>
              <p>📞 +61 469 715 062</p>
              <p>📍 Adelaide, South Australia</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
