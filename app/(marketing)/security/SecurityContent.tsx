"use client";

import { Shield, Lock, Eye, FileCheck, Activity, Database, UserCheck, Key, ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import Link from "next/link";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


const safeguards = [
  {
    icon: Lock,
    title: "Tenant isolation",
    description: "Every record is scoped to an organization with strict RLS enforcement and access controls",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Activity,
    title: "Audit-grade logging",
    description: "Immutable audit events capture who did what, when, and why across compliance actions",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: UserCheck,
    title: "Role-based access",
    description: "Granular permissions with segregation of duties protect approvals and exports",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Eye,
    title: "Evidence traceability",
    description: "Evidence links to controls, tasks, and approvals to maintain a verifiable chain of custody",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: FileCheck,
    title: "Exportable audit bundles",
    description: "Generate signed bundles with snapshots, controls, and evidence for external audits",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Shield,
    title: "Compliance gates",
    description: "Critical actions are blocked when required controls are unresolved or evidence is missing",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

const securityLayers: { title: string; icon: typeof Shield; color: string; items: string[] }[] = [
  {
    title: "Application Security",
    icon: Shield,
    color: "text-cyan-400",
    items: [
      "Multi-tenant architecture with RLS",
      "Role-based access control (RBAC)",
      "JWT-based authentication",
      "Session management & timeouts"
    ],
  },
  {
    title: "Data Protection",
    icon: Database,
    color: "text-blue-400",
    items: [
      "Evidence encryption at rest",
      "Encrypted transport",
      "Immutable audit log storage",
      "Backup & disaster recovery"
    ],
  },
  {
    title: "Compliance Controls",
    icon: FileCheck,
    color: "text-emerald-400",
    items: [
      "Evidence approval workflows",
      "Change tracking & versioning",
      "Audit trail completeness",
      "Export bundle signing"
    ],
  },
  {
    title: "Infrastructure",
    icon: Key,
    color: "text-purple-400",
    items: [
      "Framework-aligned hosting",
      "Private storage buckets",
      "Network isolation",
      "DDoS protection"
    ],
  },
];

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
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-5">
            <Shield className="h-4 w-4" />
            Security Safeguards
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Built for organizations{' '}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              that answer to regulators
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Enterprise-grade security architecture from day one</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {safeguards.map((item, idx) => (
            <ScrollReveal
              key={item.title}
              variant="scaleUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <div className={`p-6 rounded-2xl border ${item.bg} h-full`}>
                <div className={`w-11 h-11 rounded-xl border ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SecurityArchitectureLayers() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-5">
            <Lock className="h-4 w-4" />
            Security Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Defense in depth{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              across every layer
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Multi-layered security architecture protecting compliance data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {securityLayers.map((layer, idx) => (
            <ScrollReveal
              key={layer.title}
              variant="fadeUp"
              range={[idx * 0.04, 0.3 + idx * 0.04]}
            >
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] h-full">
                <div className="flex items-center gap-3 mb-4">
                  <layer.icon className={`h-5 w-5 ${layer.color}`} />
                  <h3 className="font-bold text-white text-base">{layer.title}</h3>
                </div>
                <ul className="space-y-2">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SecurityEvidenceChain() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-5">
            <Eye className="h-4 w-4" />
            Evidence Chain
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Every action traced{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              from creation to export
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Immutable audit trail for legal defensibility</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="space-y-6 sm:space-y-8">
            {evidenceChain.map((item, idx) => (
              <ScrollReveal key={item.title} variant="fadeLeft" range={[idx * 0.06, 0.35 + idx * 0.06]}>
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1.5">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SecurityCTA() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Security questions?{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            We&apos;re here to answer
          </span>
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          Request detailed security documentation or schedule a technical deep-dive with our team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="mk-btn mk-btn-primary px-8 py-4 text-base group inline-flex items-center gap-2"
          >
            Contact Security Team
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={`${appBase}/auth/signup`}
            className="mk-btn mk-btn-secondary px-8 py-4 text-base"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </section>
  );
}
