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
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.success ? "success" : resolvedSearchParams?.error ? "error" : null;

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
            Get in Touch
          </div>

          {/* Hero heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Let's discuss<br />
            <span className="text-gradient">your compliance needs</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto mb-10">
            Tell us about your organization, regulatory requirements, and audit timeline. A compliance specialist will respond within one business day.
          </p>
        </div>

        {/* Status messages */}
        {status === "success" && (
          <div className="max-w-2xl mx-auto mt-8 rounded-xl glass-panel border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-base text-emerald-200">
            ✓ Thanks for reaching out. A compliance specialist will respond within one business day.
          </div>
        )}
        {status === "error" && (
          <div className="max-w-2xl mx-auto mt-8 rounded-xl glass-panel border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-base text-rose-200">
            We could not submit your request. Please email sales@formaos.com or try again shortly.
          </div>
        )}
      </section>

      {/* Contact Form & Info */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form */}
          <form
            action={submitMarketingLead}
            className="glass-panel-strong rounded-2xl p-8 md:p-10"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Full name *</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl glass-panel px-4 py-3.5 text-[15px] text-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Work email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-xl glass-panel px-4 py-3.5 text-[15px] text-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Organization *</label>
                <input
                  name="organization"
                  required
                  className="w-full rounded-xl glass-panel px-4 py-3.5 text-[15px] text-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Your Company Pty Ltd"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Industry</label>
                <input
                  name="industry"
                  className="w-full rounded-xl glass-panel px-4 py-3.5 text-[15px] text-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Healthcare, NDIS, etc."
                />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">What do you need help with? *</label>
              <textarea
                name="message"
                rows={6}
                required
                className="w-full rounded-xl glass-panel px-4 py-3.5 text-[15px] text-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Tell us about your compliance needs, audit timeline, or any questions..."
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-8 w-full md:w-auto text-base px-10 py-4 shadow-premium-lg"
            >
              Send Request
            </button>
          </form>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-7">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Email</div>
              <p className="text-[15px] text-foreground font-medium">sales@formaos.com</p>
            </div>
            <div className="glass-panel rounded-2xl p-7">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Head office</div>
              <p className="text-[15px] text-foreground font-medium">Adelaide, South Australia</p>
            </div>
            <div className="glass-panel rounded-2xl p-7">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Response time</div>
              <p className="text-[15px] text-foreground font-medium">Within 1 business day</p>
            </div>
            <div className="glass-panel rounded-2xl p-7">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Demo availability</div>
              <p className="text-[15px] text-foreground font-medium">Live demos for qualified organizations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
