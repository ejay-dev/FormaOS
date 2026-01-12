"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem, FloatingCard } from "@/components/motion";

const lifecycle = [
  {
    icon: Target,
    title: "Model obligations",
    description: "Align frameworks, policies, and controls across every site and team.",
  },
  {
    icon: Zap,
    title: "Execute tasks",
    description: "Assign remediation work with owners, deadlines, and evidence requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Capture evidence",
    description: "Store approvals, artifacts, and audit history in a single chain of custody.",
  },
  {
    icon: TrendingUp,
    title: "Prove readiness",
    description: "Generate audit bundles, reports, and compliance posture in minutes.",
  },
];

const industries = [
  {
    icon: Activity,
    title: "NDIS & disability services",
    description: "Track practice standards, provider obligations, and incident reporting.",
  },
  {
    icon: ShieldCheck,
    title: "Healthcare providers",
    description: "Manage credentials, clinical governance, and audit readiness.",
  },
  {
    icon: Layers,
    title: "Aged care operators",
    description: "Keep evidence and policy reviews current across multiple sites.",
  },
  {
    icon: ClipboardCheck,
    title: "Community services",
    description: "Prove service quality and compliance across programs and teams.",
  },
];

const securityPoints = [
  {
    icon: Lock,
    title: "Role-based access",
    description: "Segregation of duties enforced at every level",
  },
  {
    icon: ShieldCheck,
    title: "Immutable logs",
    description: "Evidence traceability for audit defense",
  },
  {
    icon: Layers,
    title: "Org-scoped isolation",
    description: "Data isolation for every tenant",
  },
  {
    icon: Activity,
    title: "Compliance gates",
    description: "Block unsafe actions automatically",
  },
];

const pricingPreview = [
  {
    title: "Starter",
    price: "$159 AUD",
    detail: "Core compliance engine for small teams.",
    href: "/auth/signup?plan=basic",
  },
  {
    title: "Pro",
    price: "$230 AUD",
    detail: "Advanced reporting and governance controls.",
    href: "/auth/signup?plan=pro",
    featured: true,
  },
  {
    title: "Enterprise",
    price: "Custom",
    detail: "White-glove onboarding and custom frameworks.",
    href: "/contact",
  },
];

export function HomePageContent() {
  return (
    <>
      {/* Platform features - Cinematic layout */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 command-grid opacity-30" />
        <div className="absolute inset-0 vignette" />
        
        <div className="relative">
          <FadeInView className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              The Complete System
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
              Compliance lifecycle,<br className="hidden sm:block" />
              <span className="text-gradient">engineered end-to-end</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              From framework alignment to audit export—every step connected, traced, and defensible.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {lifecycle.map((step, index) => {
              const Icon = step.icon;
              return (
                <StaggerItem key={step.title}>
                  <FloatingCard
                    className="glass-intense rounded-2xl p-6 sm:p-8 h-full shadow-premium-lg signal-pulse group"
                    delay={index * 0.1}
                  >
                    <div className="rounded-xl bg-primary/10 p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold font-display mb-3">{step.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{step.description}</p>
                  </FloatingCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Industries section - Layered design */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="absolute inset-0 flow-lines opacity-20" />
        
        <div className="relative">
          <FadeInView className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-6">
              <Layers className="h-4 w-4 text-secondary" />
              Built for Regulated Industries
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
              Compliance frameworks<br className="hidden sm:block" />
              <span className="text-gradient">that match your obligations</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Pre-configured for Australian health, disability, and community services.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <StaggerItem key={industry.title}>
                  <FloatingCard
                    className="glass-panel-strong rounded-2xl p-6 sm:p-8 shadow-premium-md holo-border group"
                    delay={index * 0.15}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-secondary/10 p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold font-display mb-2">{industry.title}</h3>
                        <p className="text-sm text-foreground/70 leading-relaxed">{industry.description}</p>
                      </div>
                    </div>
                  </FloatingCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeInView delay={0.6} className="text-center mt-12">
            <Link href="/industries" className="btn btn-secondary text-base px-8 py-4">
              Explore All Industries
            </Link>
          </FadeInView>
        </div>
      </section>

      {/* Security section - Dark mode emphasis */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 security-grid opacity-40" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative">
          <FadeInView className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-6">
              <Lock className="h-4 w-4 text-accent" />
              Enterprise Security
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
              Built for<br className="hidden sm:block" />
              <span className="text-gradient">regulated environments</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Security architecture designed for organizations that answer to regulators.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <StaggerItem key={point.title}>
                  <FloatingCard
                    className="glass-frosted rounded-2xl p-6 text-center shadow-premium-md group"
                    delay={index * 0.1}
                  >
                    <div className="rounded-xl bg-accent/10 p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold font-display mb-2">{point.title}</h3>
                    <p className="text-xs text-foreground/60">{point.description}</p>
                  </FloatingCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeInView delay={0.5} className="text-center mt-12">
            <Link href="/security" className="btn btn-ghost text-base px-8 py-4">
              Security Architecture →
            </Link>
          </FadeInView>
        </div>
      </section>

      {/* Pricing preview - Premium cards */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        
        <div className="relative">
          <FadeInView className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-6">
              <TrendingUp className="h-4 w-4 text-primary" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
              Plans for every<br className="hidden sm:block" />
              <span className="text-gradient">stage of growth</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPreview.map((plan, index) => (
              <StaggerItem key={plan.title}>
                <FloatingCard
                  className={`glass-panel-strong rounded-2xl p-8 shadow-premium-lg ${
                    plan.featured ? 'ring-2 ring-primary/30 scale-105' : ''
                  }`}
                  delay={index * 0.15}
                  yOffset={plan.featured ? 15 : 10}
                >
                  {plan.featured && (
                    <div className="inline-flex glass-panel rounded-full px-3 py-1 text-xs font-bold text-primary mb-4">
                      Most Popular
                    </div>
                  )}
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    {plan.title}
                  </div>
                  <div className="text-4xl font-bold font-display mb-4">{plan.price}</div>
                  <p className="text-sm text-foreground/70 mb-8">{plan.detail}</p>
                  <Link
                    href={plan.href}
                    className={`block text-center rounded-xl px-6 py-3.5 font-semibold transition-all ${
                      plan.featured
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }`}
                  >
                    {plan.title === "Enterprise" ? "Contact Sales" : "Start Trial"}
                  </Link>
                </FloatingCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInView delay={0.5} className="text-center mt-12">
            <Link href="/pricing" className="text-primary font-semibold hover:underline">
              View detailed pricing →
            </Link>
          </FadeInView>
        </div>
      </section>

      {/* Final CTA - Cinematic */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <FadeInView>
          <div className="glass-intense rounded-3xl p-12 sm:p-16 text-center shadow-premium-2xl relative overflow-hidden">
            <div className="absolute inset-0 command-grid opacity-20" />
            <div className="absolute inset-0 shimmer" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
                Ready to operate with<br className="hidden sm:block" />
                <span className="text-gradient">complete governance clarity?</span>
              </h2>
              <p className="text-lg text-foreground/70 mb-10 max-w-2xl mx-auto">
                Start your 14-day free trial. No credit card required. Full platform access.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/signup" className="btn btn-primary text-lg px-10 py-5 shadow-premium-xl">
                  Start Free Trial
                </Link>
                <Link href="/contact" className="btn btn-secondary text-lg px-10 py-5">
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </FadeInView>
      </section>
    </>
  );
}
