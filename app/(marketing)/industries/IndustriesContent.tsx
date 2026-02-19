"use client";

import { Activity, Shield, Heart, Users, Building, GraduationCap, Briefcase, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { FadeInView } from "@/components/motion";

const industries = [
  {
    icon: Activity,
    title: "NDIS & disability services",
    description: "Practice standards alignment, incident management, worker screening, and service delivery evidence tracking",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Heart,
    title: "Healthcare providers",
    description: "Credential oversight, privacy obligations, clinical governance, and quality assurance across practitioners",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Users,
    title: "Aged care operators",
    description: "Continuous compliance with quality standards, documentation of care, and incident response proof",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: GraduationCap,
    title: "Childcare & early learning",
    description: "Safeguarding requirements, staff clearance tracking, and evidence for regulatory reviews",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Building,
    title: "Community services",
    description: "Multiple program obligations, shared evidence, and funding compliance documentation",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Briefcase,
    title: "Professional services",
    description: "Multi-site governance, professional accreditation, and audit requirements with limited staff",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

const solutions = [
  {
    problem: "Audit preparation chaos",
    solution: "FormaOS aligns practice standards to operational controls and builds an auditable evidence trail for certification"
  },
  {
    problem: "Credential oversight complexity",
    solution: "Centralize credential evidence, policy sign-off, and audit readiness for healthcare compliance teams"
  },
  {
    problem: "Multi-site governance gaps",
    solution: "Map standards to tasks and evidence so governance teams can demonstrate compliance quickly"
  },
  {
    problem: "Safeguarding blind spots",
    solution: "Track clearances, training, and incident evidence with audit-ready reporting for regulators"
  },
  {
    problem: "Program compliance fragmentation",
    solution: "Standardize controls across programs while maintaining evidence traceability and governance reporting"
  },
  {
    problem: "Professional accreditation tracking",
    solution: "Provide a single compliance system across locations with clear accountability and reporting"
  },
];

export function IndustriesContent() {
  return (
    <div className="relative">
      {/* Industries Grid */}
      <section className="mk-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-5">
              <Shield className="h-4 w-4" />
              Regulated Industries
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Pre-configured frameworks{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                for your sector
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              FormaOS includes compliance frameworks tailored for Australian regulated industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {industries.map((industry, idx) => (
              <ScrollReveal
                key={industry.title}
                variant="fadeUp"
                range={[idx * 0.04, 0.3 + idx * 0.04]}
              >
                <div className={`p-6 rounded-2xl border ${industry.bg} h-full`}>
                  <div className={`w-11 h-11 rounded-xl border ${industry.bg} flex items-center justify-center mb-4`}>
                    <industry.icon className={`h-5 w-5 ${industry.color}`} />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{industry.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{industry.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Problems & Solutions */}
      <section className="mk-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-5">
              <Layers className="h-4 w-4" />
              How FormaOS Helps
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              From operational chaos{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                to audit-ready clarity
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              See how FormaOS solves real compliance challenges across regulated industries
            </p>
          </div>

          <div className="space-y-4">
            {solutions.map((item, idx) => (
              <FadeInView key={idx} delay={idx * 0.08}>
                <div className="p-5 sm:p-6 rounded-2xl border border-white/8 bg-white/[0.02] grid lg:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-2">Problem</div>
                    <p className="text-base text-gray-300 leading-relaxed">{item.problem}</p>
                  </div>
                  <div className="hidden lg:flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2">FormaOS Solution</div>
                    <p className="text-base text-gray-200 leading-relaxed font-medium">{item.solution}</p>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Frameworks CTA */}
      <section className="mk-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" />
            Custom Frameworks
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Non-standard obligations or{' '}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              internal governance requirements?
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="mk-btn mk-btn-primary px-8 py-4 text-base group inline-flex items-center gap-2"
            >
              Contact Sales
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/product"
              className="mk-btn mk-btn-secondary px-8 py-4 text-base"
            >
              View Platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const industries = [
  {
    icon: Activity,
    title: "NDIS & disability services",
    description: "Practice standards alignment, incident management, worker screening, and service delivery evidence tracking",
    color: "cyan" as const
  },
  {
    icon: Heart,
    title: "Healthcare providers",
    description: "Credential oversight, privacy obligations, clinical governance, and quality assurance across practitioners",
    color: "blue" as const
  },
  {
    icon: Users,
    title: "Aged care operators",
    description: "Continuous compliance with quality standards, documentation of care, and incident response proof",
    color: "purple" as const
  },
  {
    icon: GraduationCap,
    title: "Childcare & early learning",
    description: "Safeguarding requirements, staff clearance tracking, and evidence for regulatory reviews",
    color: "cyan" as const
  },
  {
    icon: Building,
    title: "Community services",
    description: "Multiple program obligations, shared evidence, and funding compliance documentation",
    color: "blue" as const
  },
  {
    icon: Briefcase,
    title: "Professional services",
    description: "Multi-site governance, professional accreditation, and audit requirements with limited staff",
    color: "purple" as const
  },
];

const solutions = [
  {
    problem: "Audit preparation chaos",
    solution: "FormaOS aligns practice standards to operational controls and builds an auditable evidence trail for certification"
  },
  {
    problem: "Credential oversight complexity",
    solution: "Centralize credential evidence, policy sign-off, and audit readiness for healthcare compliance teams"
  },
  {
    problem: "Multi-site governance gaps",
    solution: "Map standards to tasks and evidence so governance teams can demonstrate compliance quickly"
  },
  {
    problem: "Safeguarding blind spots",
    solution: "Track clearances, training, and incident evidence with audit-ready reporting for regulators"
  },
  {
    problem: "Program compliance fragmentation",
    solution: "Standardize controls across programs while maintaining evidence traceability and governance reporting"
  },
  {
    problem: "Professional accreditation tracking",
    solution: "Provide a single compliance system across locations with clear accountability and reporting"
  },
];

// System-themed divider
function SystemDivider() {
  return (
    <ScrollReveal variant="scaleUp" range={[0, 0.35]}>
      <div
        className="relative h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)"
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-[rgba(0,180,220,0.2)] blur-xl" />
      </div>
    </ScrollReveal>
  );
}
