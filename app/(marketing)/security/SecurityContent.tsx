"use client";

import { Shield, Lock, Eye, FileCheck, Activity, Database, UserCheck, Key, ArrowRight } from "lucide-react";
import {
  SectionHeader,
  ArchitectureCard,
} from "@/components/motion";
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import Link from "next/link";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


const safeguards = [
  {
    icon: Lock,
    title: "Tenant isolation",
    description: "Row-Level Security (RLS) enforces strict organizational boundaries. Every record, audit log, and evidence item is scoped to its organization — no cross-tenant data access.",
  },
  {
    icon: Activity,
    title: "Tamper-evident audit logs",
    description: "Immutable, timestamped audit events capture who did what, when, and in relation to which control. Every compliance decision is permanently recorded — uneditable after creation.",
  },
  {
    icon: UserCheck,
    title: "Role-based access and RBAC",
    description: "Granular permissions with segregation of duties. Approvals, evidence exports, and control sign-offs are gated by role — preventing unauthorized access or self-approval.",
  },
  {
    icon: Eye,
    title: "Chain-of-custody evidence",
    description: "Every evidence artifact links to its uploader, approver, associated controls, and export timestamps — providing a complete defensible custody record for auditors.",
  },
  {
    icon: FileCheck,
    title: "Regulator-ready audit bundles",
    description: "Generate framework-mapped evidence bundles with control snapshots, verification records, and audit trail exports — ready for external audit or regulator review in under 2 minutes.",
  },
  {
    icon: Shield,
    title: "Compliance workflow gates",
    description: "Critical actions are blocked when required controls are unresolved or evidence is missing. Accountability is enforced by the system — before work proceeds, not after.",
  },
];

const securityLayers = {
  "Application Security": [
    "Multi-tenant architecture with Row-Level Security (RLS)",
    "Role-based access control (RBAC) with segregation of duties",
    "SAML 2.0 SSO — Okta, Azure AD, Google Workspace (Enterprise)",
    "MFA policy enforcement and session duration controls",
    "SCIM provisioning for automated user lifecycle management",
  ],
  "Data Protection": [
    "AES-256 encryption at rest — evidence, controls, and audit logs",
    "TLS 1.3 encryption in transit — no exceptions",
    "Immutable audit log storage — tamper-evident by design",
    "Backup, disaster recovery, and business continuity controls",
  ],
  "Compliance Controls": [
    "Evidence approval workflows with sign-off chain",
    "Change tracking, versioning, and before/after audit capture",
    "Audit trail completeness — every compliance action recorded",
    "Penetration testing — annual independent security review",
  ],
  "Infrastructure & Residency": [
    "AU-based hosting by default — aligned for Australian-regulated orgs",
    "US and EU data residency options for international requirements",
    "Private storage buckets with network isolation",
    "DDoS protection and cloud-native availability controls",
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

/* ─── Lightweight section wrapper ─── */
function LightSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #030712 0%, #0a0f1f 50%, #0f172a 100%)',
      }}
    >
      {/* Single subtle glow — no blur filter, just a radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 20%, rgba(0, 60, 120, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 80% 30%, rgba(30, 64, 175, 0.18) 0%, transparent 45%),
            radial-gradient(ellipse 80% 80% at 50% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)
          `,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 7, 18, 0.4) 100%)',
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

/* ─── Lightweight card — no backdrop-filter, uses solid bg ─── */
function LightCard({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`
        rounded-2xl
        bg-gradient-to-b from-white/[0.07] to-white/[0.02]
        border border-white/[0.1]
        shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
        transition-colors duration-300
        hover:border-white/[0.18]
        ${glow ? 'shadow-[0_0_20px_rgba(139,92,246,0.1),0_8px_32px_rgba(0,0,0,0.4)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function SecuritySafeguards() {
  return (
    <LightSection className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Security Safeguards"
          badgeIcon={<Shield className="h-4 w-4 text-accent" />}
          title={<>Built for organizations<br className="hidden sm:inline" /><span className="text-gradient-system">that answer to regulators</span></>}
          subtitle="Enterprise-grade security architecture from day one"
          alignment="center"
        />

        <SectionChoreography pattern="stagger-wave" stagger={0.04} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {safeguards.map((safeguard) => (
            <LightCard key={safeguard.title} glow className="p-6 sm:p-8 h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mb-4">
                  <safeguard.icon className="h-7 w-7 text-[rgb(139,92,246)]" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{safeguard.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{safeguard.description}</p>
              </div>
            </LightCard>
          ))}
        </SectionChoreography>
      </div>
    </LightSection>
  );
}

export function SecurityArchitectureLayers() {
  return (
    <LightSection className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Security Architecture"
          badgeIcon={<Lock className="h-4 w-4 text-primary" />}
          title={<>Defense in depth<br className="hidden sm:inline" /><span className="text-gradient-system">across every layer</span></>}
          subtitle="Multi-layered security architecture protecting compliance data"
          alignment="center"
        />

        <SectionChoreography pattern="alternating" stagger={0.04} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {Object.entries(securityLayers).map(([title, components], idx) => (
            <div key={title}>
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
            </div>
          ))}
        </SectionChoreography>
      </div>
    </LightSection>
  );
}

export function SecurityEvidenceChain() {
  return (
    <LightSection className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        <SectionHeader
          badge="Evidence Chain"
          badgeIcon={<Eye className="h-4 w-4 text-secondary" />}
          title={<>Every action traced<br className="hidden sm:inline" /><span className="text-gradient-system">from creation to export</span></>}
          subtitle="Immutable audit trail for legal defensibility"
          alignment="center"
        />

        <LightCard className="p-6 sm:p-10 lg:p-12">
          <div className="space-y-6 sm:space-y-8">
            {evidenceChain.map((item, idx) => (
              <ScrollReveal key={item.title} variant="depthSlide" range={[idx * 0.06, 0.3 + idx * 0.06]}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shadow-[0_0_15px_rgba(0,180,220,0.08)]">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-display mb-2">{item.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </LightCard>
      </div>
    </LightSection>
  );
}

export function SecurityCTA() {
  return (
    <LightSection className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        <ScrollReveal variant="splitLeft" range={[0, 0.35]}>
          <LightCard
            className="p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden"
          >
            {/* Subtle gradient mesh — static, no animation */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: `
                  radial-gradient(ellipse 60% 50% at 30% 40%, rgba(0, 180, 220, 0.15) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 60% at 70% 60%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)
                `,
              }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                Security review?<br />
                <span className="text-gradient-system-animated">We&apos;re ready before you ask</span>
              </h2>

              <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                Enterprise security review packet available now — architecture, encryption, identity governance, penetration testing, data residency, and DPA. No delays for your procurement team.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/security-review"
                  className="group inline-flex items-center gap-2 btn btn-primary btn-premium text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                >
                  Review Security Packet
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                >
                  Schedule Security Briefing
                </Link>
              </div>
            </div>
          </LightCard>
        </ScrollReveal>
      </div>
    </LightSection>
  );
}
