"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileCheck } from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem, FloatingCard } from "@/components/motion";

const safeguards = [
  {
    icon: Lock,
    title: "Tenant isolation",
    description: "Every record is scoped to an organization with strict RLS enforcement and access controls.",
  },
  {
    icon: FileCheck,
    title: "Audit-grade logging",
    description: "Immutable audit events capture who did what, when, and why across compliance actions.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "Granular permissions with segregation of duties protect approvals and exports.",
  },
  {
    icon: Eye,
    title: "Evidence traceability",
    description: "Evidence links to controls, tasks, and approvals to maintain a verifiable chain of custody.",
  },
  {
    icon: FileCheck,
    title: "Exportable audit bundles",
    description: "Generate signed bundles with snapshots, controls, and evidence for external audits.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance gates",
    description: "Critical actions are blocked when required controls are unresolved or evidence is missing.",
  },
  {
    icon: Lock,
    title: "Evidence immutability",
    description: "Approvals, rejections, and changes are logged with before/after state for legal defensibility.",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructure posture",
    description: "Hosted on secure cloud infrastructure with private storage buckets and encrypted transport.",
  },
];

export function SecurityContent() {
  return (
    <>
      {/* Safeguards Grid */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 overflow-hidden">
        <div className="absolute inset-0 security-grid opacity-40" />
        <div className="absolute inset-0 vignette" />
        
        <div className="relative">
          <FadeInView className="mb-16 text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Security Safeguards
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Protection at<br />
              <span className="text-gradient">every layer</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Eight security controls built into the platform foundation
            </p>
          </FadeInView>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {safeguards.map((item, index) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title}>
                  <FloatingCard className="glass-frosted rounded-2xl p-6 text-center shadow-premium-md signal-pulse group">
                    <div className="rounded-xl bg-accent/10 p-3 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2 font-display">{item.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{item.description}</p>
                  </FloatingCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Access Control Philosophy */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="absolute inset-0 flow-lines opacity-20" />
        
        <div className="relative">
          <FadeInView className="mb-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Access control philosophy</div>
          </FadeInView>
          
          <StaggerContainer className="grid gap-6 md:grid-cols-2">
            <StaggerItem>
              <FloatingCard className="glass-panel-strong rounded-2xl p-8 shadow-premium-lg holo-border">
                <h3 className="text-xl font-semibold text-foreground mb-3 font-display">Segregation of duties</h3>
                <p className="text-[15px] text-foreground/70 leading-relaxed">
                  Users cannot approve their own evidence or resolve their own compliance blocks. Approval workflows are
                  enforced server-side and logged.
                </p>
              </FloatingCard>
            </StaggerItem>
            <StaggerItem>
              <FloatingCard className="glass-panel-strong rounded-2xl p-8 shadow-premium-lg holo-border">
                <h3 className="text-xl font-semibold text-foreground mb-3 font-display">Audit-first design</h3>
                <p className="text-[15px] text-foreground/70 leading-relaxed">
                  Every sensitive action records actor, role, entity scope, and evidence context to support regulator review.
                </p>
              </FloatingCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Trust and Assurance CTA */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <FadeInView delay={0.3}>
          <div className="glass-intense rounded-3xl p-10 shadow-premium-2xl relative overflow-hidden">
            <div className="absolute inset-0 command-grid opacity-20" />
            <div className="absolute inset-0 shimmer" />
            
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Trust and assurance</div>
                <h2 className="text-2xl md:text-3xl font-semibold font-display mb-3">
                  Need a formal<br />
                  <span className="text-gradient">security review?</span>
                </h2>
                <p className="text-[15px] text-foreground/70 leading-relaxed">
                  We provide architecture briefings, audit evidence exports, and compliance documentation on request.
                </p>
              </div>
              <Link
                href="/contact"
                className="btn btn-primary text-base px-8 py-4 whitespace-nowrap shadow-premium-xl"
              >
                Contact Security Team
              </Link>
            </div>
          </div>
        </FadeInView>
      </section>
    </>
  );
}
