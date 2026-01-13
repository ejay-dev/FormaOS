"use client";

import { Shield, Lock, Eye, FileCheck, Activity, Database, UserCheck, Key, ArrowRight } from "lucide-react";
import {
  CinematicSection,
  SectionHeader,
  FeatureCard,
  ArchitectureCard,
  VisualDivider,
  ParticleField,
  GradientMesh,
  InteractiveCard,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
import Link from "next/link";

const safeguards = [
  {
    icon: Lock,
    title: "Tenant isolation",
    description: "Every record is scoped to an organization with strict RLS enforcement and access controls",
  },
  {
    icon: Activity,
    title: "Audit-grade logging",
    description: "Immutable audit events capture who did what, when, and why across compliance actions",
  },
  {
    icon: UserCheck,
    title: "Role-based access",
    description: "Granular permissions with segregation of duties protect approvals and exports",
  },
  {
    icon: Eye,
    title: "Evidence traceability",
    description: "Evidence links to controls, tasks, and approvals to maintain a verifiable chain of custody",
  },
  {
    icon: FileCheck,
    title: "Exportable audit bundles",
    description: "Generate signed bundles with snapshots, controls, and evidence for external audits",
  },
  {
    icon: Shield,
    title: "Compliance gates",
    description: "Critical actions are blocked when required controls are unresolved or evidence is missing",
  },
];

const securityLayers = {
  "Application Security": [
    "Multi-tenant architecture with RLS",
    "Role-based access control (RBAC)",
    "JWT-based authentication",
    "Session management & timeouts"
  ],
  "Data Protection": [
    "Evidence encryption at rest",
    "Encrypted transport (TLS 1.3)",
    "Immutable audit log storage",
    "Backup & disaster recovery"
  ],
  "Compliance Controls": [
    "Evidence approval workflows",
    "Change tracking & versioning",
    "Audit trail completeness",
    "Export bundle signing"
  ],
  "Infrastructure": [
    "SOC 2 Type II hosting",
    "Private storage buckets",
    "Network isolation",
    "DDoS protection"
  ]
};

export function SecurityContent() {
  return (
    <>
      {/* Security Safeguards Grid */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium background overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ParticleField 
            particleCount={25} 
            colors={["rgba(20, 184, 166, 0.4)", "rgba(0, 212, 251, 0.3)"]}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Security Safeguards"
            badgeIcon={<Shield className="h-4 w-4 text-accent" />}
            title={<>Built for organizations<br className="hidden sm:inline" /><span className="text-gradient">that answer to regulators</span></>}
            subtitle="Enterprise-grade security architecture from day one"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {safeguards.map((safeguard, idx) => (
              <InteractiveCard
                key={safeguard.title}
                delay={idx * 0.1}
                glowColor="rgba(20, 184, 166, 0.3)"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                    <safeguard.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{safeguard.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{safeguard.description}</p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Security Architecture Layers */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="primary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Security Architecture"
            badgeIcon={<Lock className="h-4 w-4 text-primary" />}
            title={<>Defense in depth<br className="hidden sm:inline" /><span className="text-gradient">across every layer</span></>}
            subtitle="Multi-layered security architecture protecting compliance data"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {Object.entries(securityLayers).map(([title, components], idx) => (
              <ArchitectureCard
                key={title}
                title={title}
                components={components}
                icon={
                  idx === 0 ? Shield : 
                  idx === 1 ? Database : 
                  idx === 2 ? FileCheck : 
                  Key
                }
                delay={idx * 0.15}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Evidence Immutability */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="secondary"
        className="py-16 sm:py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Evidence Chain"
            badgeIcon={<Eye className="h-4 w-4 text-secondary" />}
            title={<>Every action traced<br className="hidden sm:inline" /><span className="text-gradient">from creation to export</span></>}
            subtitle="Immutable audit trail for legal defensibility"
            alignment="center"
          />

          <div className="glass-panel-strong rounded-xl sm:rounded-2xl p-6 sm:p-10 lg:p-12 shadow-premium-lg">
            <div className="space-y-6 sm:space-y-8">
              <FadeInView delay={0}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl glass-intense flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-display mb-2">Evidence immutability</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Approvals, rejections, and changes are logged with before/after state for legal defensibility
                    </p>
                  </div>
                </div>
              </FadeInView>

              <FadeInView delay={0.2}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl glass-intense flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-display mb-2">Complete chain of custody</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Every evidence artifact tracks who uploaded, who approved, which controls it satisfies, and when it was exported
                    </p>
                  </div>
                </div>
              </FadeInView>

              <FadeInView delay={0.4}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl glass-intense flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-display mb-2">Audit event completeness</h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Immutable logs capture every compliance decision with timestamp, actor, context, and outcome
                    </p>
                  </div>
                </div>
              </FadeInView>
            </div>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Security CTA */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="accent"
        className="py-16 sm:py-20 lg:py-32 relative"
      >
        {/* Premium gradient mesh overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GradientMesh 
            colors={["rgba(20, 184, 166, 0.1)", "rgba(0, 212, 251, 0.08)", "rgba(139, 92, 246, 0.06)"]}
            className="opacity-60"
          />
        </div>
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <div className="glass-intense rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-premium-2xl relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
              
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                  Security questions?<br />
                  <span className="text-gradient">We're here to answer</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Request detailed security documentation or schedule a technical deep-dive with our team.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link 
                    href="/contact" 
                    className="group inline-flex items-center gap-2 btn btn-primary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                  >
                    Contact Security Team
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </CinematicSection>
    </>
  );
}
