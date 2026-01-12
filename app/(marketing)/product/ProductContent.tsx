"use client";

import Link from "next/link";
import { FadeInView, StaggerContainer, StaggerItem, FloatingCard } from "@/components/motion";

const lifecycle = [
  {
    title: "Structure",
    description: "Model your organization, sites, and teams with clear control ownership.",
  },
  {
    title: "Execute",
    description: "Turn controls into tasks with due dates, assignees, and accountability.",
  },
  {
    title: "Prove",
    description: "Collect evidence and approvals with immutable audit logs and traceability.",
  },
  {
    title: "Report",
    description: "Export audit bundles, readiness reports, and executive risk summaries.",
  },
];

const modules = [
  {
    title: "Policies",
    description:
      "Maintain approved policies with review cadence, ownership, and evidence that staff acknowledgements are current.",
  },
  {
    title: "Tasks",
    description:
      "Operationalize controls into tasks with due dates, assignees, and remediation tracking.",
  },
  {
    title: "Evidence Vault",
    description:
      "Store artifacts with approval history, mapped controls, and audit-ready context.",
  },
  {
    title: "Audit Trail",
    description:
      "Immutable logs of evidence decisions, task completion, and control evaluations.",
  },
  {
    title: "Compliance Frameworks",
    description:
      "Align requirements to frameworks, score posture, and generate audit exports.",
  },
];

const workflows = [
  {
    title: "NDIS audit preparation",
    steps: [
      "Map NDIS practice standards to controls",
      "Assign remediation tasks and due dates",
      "Collect evidence from service delivery teams",
      "Generate an audit bundle for certification",
    ],
  },
  {
    title: "Healthcare credential verification",
    steps: [
      "Capture credential requirements per role",
      "Collect documents and approvals",
      "Flag missing or expiring credentials",
      "Provide auditor-ready access logs",
    ],
  },
];

export function ProductContent() {
  return (
    <>
      {/* Lifecycle Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 overflow-hidden">
        <div className="absolute inset-0 command-grid opacity-30" />
        <div className="absolute inset-0 vignette" />
        
        <div className="relative">
          <FadeInView className="mb-16 text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Compliance Lifecycle
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              A system designed for<br />
              <span className="text-gradient">daily operations</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Transform compliance from quarterly burden into operational rhythm
            </p>
          </FadeInView>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {lifecycle.map((step, index) => (
              <StaggerItem key={step.title}>
                <FloatingCard className="glass-intense rounded-2xl p-7 shadow-premium-lg signal-pulse group">
                  <div className="inline-flex glass-panel rounded-lg px-3 py-1.5 text-xs font-bold text-primary mb-5 group-hover:scale-110 transition-transform">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-display">{step.title}</h3>
                  <p className="text-[15px] text-foreground/70 leading-relaxed">{step.description}</p>
                </FloatingCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Modules Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="absolute inset-0 flow-lines opacity-20" />
        
        <div className="relative">
          <FadeInView className="mb-16 text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Platform Modules
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Everything you need<br />
              <span className="text-gradient">in one system</span>
            </h2>
          </FadeInView>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <StaggerItem key={module.title}>
                <FloatingCard className="glass-panel-strong rounded-2xl p-7 shadow-premium-md holo-border group">
                  <h3 className="text-xl font-semibold mb-3 font-display group-hover:text-primary transition-colors">{module.title}</h3>
                  <p className="text-[15px] text-foreground/70 leading-relaxed">{module.description}</p>
                </FloatingCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Workflows Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="absolute inset-0 security-grid opacity-30" />
        
        <div className="relative">
          <FadeInView className="mb-16 text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Example Workflows
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Real-world<br />
              <span className="text-gradient">compliance operations</span>
            </h2>
          </FadeInView>

          <StaggerContainer className="grid gap-8 lg:grid-cols-2">
            {workflows.map((workflow, index) => (
              <StaggerItem key={workflow.title}>
                <FloatingCard className="glass-frosted rounded-2xl p-8 shadow-premium-lg">
                  <h3 className="text-2xl font-semibold mb-6 font-display">{workflow.title}</h3>
                  <div className="space-y-4">
                    {workflow.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${stepIndex * 0.1}s` }}>
                        <div className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full glass-panel text-xs font-bold text-primary">
                          {stepIndex + 1}
                        </div>
                        <p className="text-[15px] text-foreground/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </FloatingCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <FadeInView delay={0.2}>
          <div className="glass-intense rounded-3xl p-10 text-center shadow-premium-2xl relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Ready to transform<br />
                <span className="text-gradient">your compliance operations?</span>
              </h2>
              <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
                Start your 14-day free trial today. No payment details required.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="btn btn-primary text-base px-8 py-4 shadow-premium-xl"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-secondary text-base px-8 py-4"
                >
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
