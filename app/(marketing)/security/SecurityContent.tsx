"use client";

import { Shield, Lock, Eye, FileCheck, Activity, Database, UserCheck, Key, ArrowRight } from "lucide-react";
import {
  SectionHeader,
  ArchitectureCard,
  GradientMesh,
  SystemBackground,
  GlassCard,
  SectionGlow,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import Link from "next/link";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


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
    "Encrypted transport",
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
    "Framework-aligned hosting",
    "Private storage buckets",
    "Network isolation",
    "DDoS protection"
  ]
};

const evidenceChain = [
  {
    icon: FileCheck,
    title: "Evidence immutability",
    description: "Approvals, rejections, and changes are logged with before/after state for legal defensibility"
  },
  {
    icon: Eye,
    title: "Complete chain of custody",
    description: "Every evidence artifact tracks who uploaded, who approved, which controls it satisfies, and when it was exported"
  },
  {
    icon: Activity,
    title: "Audit event completeness",
    description: "Immutable logs capture every compliance decision with timestamp, actor, context, and outcome"
  },
];

export function SecuritySafeguards() {
  return (
    <SystemBackground variant="metrics" className="py-12 sm:py-16 lg:py-20">
      <SectionGlow color="purple" intensity="medium" position="top" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Security Safeguards"
          badgeIcon={<Shield className="h-4 w-4 text-accent" />}
          title={<>Built for organizations<br className="hidden sm:inline" /><span className="text-gradient-system">that answer to regulators</span></>}
          subtitle="Enterprise-grade security architecture from day one"
          alignment="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {safeguards.map((safeguard, idx) => (
            <ScrollReveal
              key={safeguard.title}
              variant="scaleUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
              className="card-radial-glow section-metrics"
            >
              <GlassCard variant="default" glow glowColor="purple" className="p-6 sm:p-8 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mb-4">
                    <safeguard.icon className="h-7 w-7 text-[rgb(139,92,246)]" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{safeguard.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{safeguard.description}</p>
                </div>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SystemBackground>
  );
}

export function SecurityArchitectureLayers() {
  return (
    <SystemBackground variant="process" className="py-12 sm:py-16 lg:py-20">
      <SectionGlow color="cyan" intensity="high" position="center" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Security Architecture"
          badgeIcon={<Lock className="h-4 w-4 text-primary" />}
          title={<>Defense in depth<br className="hidden sm:inline" /><span className="text-gradient-system">across every layer</span></>}
          subtitle="Multi-layered security architecture protecting compliance data"
          alignment="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {Object.entries(securityLayers).map(([title, components], idx) => (
            <ScrollReveal
              key={title}
              variant="fadeUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
              className="card-radial-glow section-process"
            >
              <ArchitectureCard
                title={title}
                components={components}
                icon={
                  idx === 0 ? Shield :
                  idx === 1 ? Database :
                  idx === 2 ? FileCheck :
                  Key
                }
                delay={0}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SystemBackground>
  );
}

export function SecurityEvidenceChain() {
  return (
    <SystemBackground variant="info" className="py-12 sm:py-16 lg:py-20">
      <SectionGlow color="blue" intensity="low" position="center" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Evidence Chain"
          badgeIcon={<Eye className="h-4 w-4 text-secondary" />}
          title={<>Every action traced<br className="hidden sm:inline" /><span className="text-gradient-system">from creation to export</span></>}
          subtitle="Immutable audit trail for legal defensibility"
          alignment="center"
        />

        <GlassCard variant="elevated" className="p-6 sm:p-10 lg:p-12">
          <div className="space-y-6 sm:space-y-8">
            {evidenceChain.map((item, idx) => (
              <FadeInView key={item.title} delay={idx * 0.2}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl glass-system flex items-center justify-center glow-system-cyan">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-display mb-2">{item.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </GlassCard>
      </div>
    </SystemBackground>
  );
}

export function SecurityCTA() {
  return (
    <SystemBackground variant="process" intensity="high" className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        <FadeInView>
          <GlassCard
            variant="intense"
            glow
            glowColor="cyan"
            className="p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <GradientMesh animate={false} />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                Security questions?<br />
                <span className="text-gradient-system-animated">We&apos;re here to answer</span>
              </h2>

              <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                Request detailed security documentation or schedule a technical deep-dive with our team.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 btn btn-primary btn-premium text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                >
                  Contact Security Team
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`${appBase}/auth/signup`}
                  className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </GlassCard>
        </FadeInView>
      </div>
    </SystemBackground>
  );
}
