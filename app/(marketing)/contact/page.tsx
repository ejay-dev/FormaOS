import type { Metadata } from "next";
import { submitMarketingLead } from "./actions";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Contact",
  description: "Request a demo or contact the FormaOS team.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "FormaOS | Contact",
    description: "Request a demo or contact the FormaOS team.",
    type: "website",
    url: `${siteUrl}/contact`,
  },
};

type ContactPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default function ContactPage({ searchParams }: ContactPageProps) {
  const status = searchParams?.success ? "success" : searchParams?.error ? "error" : null;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <section className="space-y-6 mk-fade-up mk-parallax-slow">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Contact</div>
        <h1 className="text-4xl font-semibold font-[var(--font-display)]">Request a demo or speak with our team.</h1>
        <p className="text-lg text-slate-300">
          Tell us about your organization, regulatory requirements, and audit timeline. We will respond with next steps.
        </p>
        {status === "success" ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Thanks for reaching out. A compliance specialist will respond within one business day.
          </div>
        ) : null}
        {status === "error" ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            We could not submit your request. Please email sales@formaos.com or try again shortly.
          </div>
        ) : null}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.6fr] mk-parallax-fast">
        <form
          action={submitMarketingLead}
          className="mk-card mk-tilt mk-depth-2 rounded-2xl p-8"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Full name</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Work email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Organization</label>
              <input
                name="organization"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Industry</label>
              <input
                name="industry"
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-100"
              />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">What do you need help with?</label>
            <textarea
              name="message"
              rows={5}
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="mk-cta mt-6 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
          >
            Send Request
          </button>
        </form>
        <div className="space-y-6">
          <MarketingAnchor
            title="Demo Operations Stack"
            subtitle="Secure onboarding for regulated teams."
            badge="Live demo"
            accent="236 72 153"
            compact
          />
          <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</div>
            <p className="mt-2 text-sm text-slate-300">sales@formaos.com</p>
          </div>
          <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Head office</div>
            <p className="mt-2 text-sm text-slate-300">Melbourne, Australia</p>
          </div>
          <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Response time</div>
            <p className="mt-2 text-sm text-slate-300">Within 1 business day</p>
          </div>
        </div>
      </section>
    </div>
  );
}
