"use client";

import Link from "next/link";
import { FadeInView, StaggerContainer, StaggerItem, FloatingCard } from "@/components/motion";

const industries = [
  {
    title: "NDIS and disability services",
    pain: "Audit preparation, incident management, worker screening, and evidence of service delivery.",
    solution:
      "FormaOS aligns practice standards to operational controls and builds an auditable evidence trail for certification.",
  },
  {
    title: "Healthcare and allied health",
    pain: "Credential oversight, privacy obligations, and quality assurance processes across clinicians.",
    solution:
      "Centralize credential evidence, policy sign-off, and audit readiness for healthcare compliance teams.",
  },
  {
    title: "Aged care",
    pain: "Continuous compliance against quality standards, documentation of care, and incident response proof.",
    solution:
      "Map aged care standards to tasks and evidence so governance teams can demonstrate compliance quickly.",
  },
  {
    title: "Childcare and early learning",
    pain: "Safeguarding requirements, staff clearance tracking, and evidence for regulatory reviews.",
    solution:
      "Track clearances, training, and incident evidence with audit-ready reporting for childcare regulators.",
  },
  {
    title: "Community services",
    pain: "Multiple program obligations, shared evidence, and funding compliance documentation.",
    solution:
      "Standardize controls across programs while maintaining evidence traceability and governance reporting.",
  },
  {
    title: "Regulated professional services",
    pain: "Multi-site governance, professional accreditation, and audit requirements with limited staff.",
    solution:
      "Provide a single compliance system across locations with clear accountability and reporting.",
  },
  {
    title: "Custom frameworks",
    pain: "Non-standard obligations or internal governance requirements with no clear tooling.",
    solution:
      "Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.",
  },
];

export function IndustriesContent() {
  return (
    <>
      {/* Industries Grid */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24 overflow-hidden">
        <div className="absolute inset-0 command-grid opacity-30" />
        <div className="absolute inset-0 vignette" />
        
        <div className="relative">
          <FadeInView className="mb-16 text-center max-w-3xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Industry Packs
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Compliance frameworks<br />
              <span className="text-gradient">tailored to your sector</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Each industry pack maps to real compliance obligations, not generic workflows
            </p>
          </FadeInView>

          <StaggerContainer className="grid gap-6 lg:grid-cols-2">
            {industries.map((industry, index) => (
              <StaggerItem key={industry.title}>
                <FloatingCard className="glass-panel-strong rounded-2xl p-8 shadow-premium-lg signal-pulse group">
                  <h3 className="text-xl font-semibold text-foreground mb-4 font-display group-hover:text-primary transition-colors">{industry.title}</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Pain points</div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{industry.pain}</p>
                    </div>
                    <div className="glass-panel rounded-xl p-4">
                      <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">FormaOS response</div>
                      <p className="text-sm text-foreground leading-relaxed">{industry.solution}</p>
                    </div>
                  </div>
                </FloatingCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Custom Framework CTA */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <FadeInView delay={0.3}>
          <div className="glass-intense rounded-3xl p-10 shadow-premium-2xl relative overflow-hidden">
            <div className="absolute inset-0 flow-lines opacity-20" />
            <div className="absolute inset-0 shimmer" />
            
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Need a tailored framework?</div>
                <h2 className="text-2xl md:text-3xl font-semibold font-display mb-3">
                  We configure FormaOS<br />
                  <span className="text-gradient">for your obligations</span>
                </h2>
                <p className="text-[15px] text-foreground/70 leading-relaxed">Tell us your framework requirements and we map controls, evidence, and reports.</p>
              </div>
              <Link
                href="/pricing"
                className="btn btn-primary text-base px-8 py-4 whitespace-nowrap shadow-premium-xl"
              >
                Enterprise Plans
              </Link>
            </div>
          </div>
        </FadeInView>
      </section>
    </>
  );
}
