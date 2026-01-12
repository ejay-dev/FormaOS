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
import { HomePageContent } from "./components/HomePageContent";

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

export default function HomePage() {
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
                href="/auth/signup" 
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
                  <div className="grid grid-cols-2 gap-2 text-xs">
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
                  <div className="grid grid-cols-3 gap-2 text-xs">
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

      {/* Rest of the content with motion */}
      <HomePageContent />

      <MarketingAnchor 
        title="Start your compliance transformation"
        subtitle="Move from tracking to enforcement with FormaOS"
        badge="Platform Access"
      />
    </div>
  );
}
