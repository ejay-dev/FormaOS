import type { Metadata } from "next";

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
    <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
      <div className="mk-card rounded-3xl p-8 md:p-12 mk-fade-up">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Our Story</div>
          <h1 className="text-4xl font-semibold text-slate-100 font-[var(--font-display)]">
            Our Story
          </h1>
          <p className="text-base text-slate-300">
            FormaOS was not built to be another software platform.
          </p>
          <p className="text-base text-slate-300">
            It was built to solve a problem that too many regulated teams quietly live with every day:
          </p>
          <p className="text-base text-slate-300">
            fragmented systems, manual audits, compliance anxiety, and operational chaos hidden behind
            spreadsheets.
          </p>
        </div>

        <div className="mt-10 space-y-8 mk-stagger">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              Where It Started
            </h2>
            <p className="text-base text-slate-300">
              FormaOS began in Adelaide, South Australia, not in a boardroom—but inside real operational
              workflows.
            </p>
            <p className="text-base text-slate-300">
              Healthcare providers, disability services, compliance-driven organizations and multi-site
              teams were drowning in:
            </p>
            <div className="space-y-2 text-base text-slate-300">
              <div>disconnected tools,</div>
              <div>duplicated reporting,</div>
              <div>audit preparation that stole weeks of productivity, and</div>
              <div>risk that only surfaced when it was already too late.</div>
            </div>
            <p className="text-base text-slate-300">Compliance was being treated as paperwork.</p>
            <p className="text-base text-slate-300">But in reality, it is infrastructure.</p>
            <p className="text-base text-slate-300">So we set out to rebuild it properly.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              The Vision
            </h2>
            <p className="text-base text-slate-300">We asked one fundamental question:</p>
            <p className="text-base text-slate-300">
              What if compliance wasn’t something you prepared for… but something you lived inside every
              day?
            </p>
            <p className="text-base text-slate-300">
              FormaOS was designed as a true Compliance Operating System:
            </p>
            <div className="space-y-2 text-base text-slate-300">
              <div>not reminders,</div>
              <div>not document storage,</div>
              <div>
                but a system that aligns controls, evidence, tasks, governance, and accountability in
                one connected environment.
              </div>
            </div>
            <p className="text-base text-slate-300">An OS for regulated operations.</p>
            <p className="text-base text-slate-300">A command center for audit-ready teams.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              What Makes FormaOS Different
            </h2>
            <p className="text-base text-slate-300">FormaOS unifies what used to live in silos:</p>
            <div className="space-y-2 text-base text-slate-300">
              <div>Operational tasks</div>
              <div>Evidence & documentation</div>
              <div>Governance controls</div>
              <div>Audit readiness</div>
              <div>Executive oversight</div>
            </div>
            <p className="text-base text-slate-300">
              All inside a single, traceable, accountable system of record.
            </p>
            <p className="text-base text-slate-300">No scattered tools.</p>
            <p className="text-base text-slate-300">No last-minute audit scrambles.</p>
            <p className="text-base text-slate-300">No blind spots.</p>
            <p className="text-base text-slate-300">Just clarity, structure, and confidence.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              Built for People Who Carry Responsibility
            </h2>
            <p className="text-base text-slate-300">We don’t build for “users.”</p>
            <p className="text-base text-slate-300">We build for people who are responsible for:</p>
            <div className="space-y-2 text-base text-slate-300">
              <div>safety,</div>
              <div>compliance,</div>
              <div>outcomes,</div>
              <div>and trust.</div>
            </div>
            <p className="text-base text-slate-300">
              From NDIS providers to healthcare operators, multi-site organizations, and
              governance-driven enterprises — FormaOS is for teams who cannot afford mistakes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              Leadership
            </h2>
            <p className="text-base text-slate-300">Ejaz Hussain</p>
            <p className="text-base text-slate-300">Chief Engineer, FormaOS</p>
            <p className="text-base text-slate-300">Adelaide, South Australia</p>
            <p className="text-base text-slate-300">
              FormaOS is engineered with one guiding principle:
            </p>
            <p className="text-base text-slate-300">
              If systems shape behavior, then compliance systems must shape accountability.
            </p>
            <p className="text-base text-slate-300">
              Every feature, workflow, and control inside FormaOS exists to make regulated operations
              not just compliant — but resilient, transparent, and future-proof.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              Our Commitment
            </h2>
            <p className="text-base text-slate-300">
              We are not here to build software that looks impressive.
            </p>
            <p className="text-base text-slate-300">
              We are here to build infrastructure that stands up in audits, scales with complexity, and
              protects the people who rely on it.
            </p>
            <p className="text-base text-slate-300">FormaOS is not just a product.</p>
            <p className="text-base text-slate-300">It is a framework for operational trust.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100 font-[var(--font-display)]">
              Contact
            </h2>
            <p className="text-base text-slate-300">📧 formaos.team@gmail.com</p>
            <p className="text-base text-slate-300">📞 +61 469 715 062</p>
            <p className="text-base text-slate-300">📍 Adelaide, South Australia</p>
          </section>
        </div>
      </div>
    </div>
  );
}
