"use client";

import { Activity, Shield, Heart, Users, Building, GraduationCap, Briefcase, ArrowRight, Layers } from "lucide-react";
import {
  SectionHeader,
  GradientMesh,
  SystemBackground,
  GlassCard,
  SectionGlow,
} from "@/components/motion";
import { FadeInView } from "@/components/motion";
import Link from "next/link";
import { motion } from "framer-motion";
import { duration } from '@/config/motion';

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
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: duration.slower }}
      className="relative h-px w-full"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)"
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-[rgba(0,180,220,0.2)] blur-xl" />
    </motion.div>
  );
}

export function IndustriesContent() {
  return (
    <div className="relative">
      {/* Industries Grid - Metrics variant */}
      <SystemBackground variant="metrics" className="py-12 sm:py-16 lg:py-20">
        <SectionGlow color="cyan" intensity="medium" position="top" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Regulated Industries"
            badgeIcon={<Shield className="h-4 w-4 text-primary" />}
            title={<>Pre-configured frameworks<br className="hidden sm:inline" /><span className="text-gradient-system">for your sector</span></>}
            subtitle="FormaOS includes compliance frameworks tailored for Australian regulated industries"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {industries.map((industry, idx) => (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="card-radial-glow section-metrics"
              >
                <GlassCard 
                  variant="default" 
                  glow 
                  glowColor={industry.color}
                  className="p-6 sm:p-8 h-full"
                >
                  <div className="flex flex-col items-start">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 ${
                      industry.color === "cyan" ? "bg-[rgba(0,180,220,0.1)] border border-[rgba(0,180,220,0.2)]" :
                      industry.color === "blue" ? "bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]" :
                      "bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]"
                    }`}>
                      <industry.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${
                        industry.color === "cyan" ? "text-[rgb(0,180,220)]" :
                        industry.color === "blue" ? "text-[rgb(59,130,246)]" :
                        "text-[rgb(139,92,246)]"
                      }`} />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{industry.title}</h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">{industry.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Problems & Solutions - Process variant */}
      <SystemBackground variant="process" className="py-12 sm:py-16 lg:py-20">
        <SectionGlow color="blue" intensity="high" position="center" />
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="How FormaOS Helps"
            badgeIcon={<Layers className="h-4 w-4 text-secondary" />}
            title={<>From operational chaos<br className="hidden sm:inline" /><span className="text-gradient-system">to audit-ready clarity</span></>}
            subtitle="See how FormaOS solves real compliance challenges across regulated industries"
            alignment="center"
          />

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {solutions.map((item, idx) => (
              <FadeInView key={idx} delay={idx * 0.1}>
                <GlassCard 
                  variant="elevated" 
                  className="p-6 sm:p-8"
                >
                  <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 lg:gap-8 items-center">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-2 sm:mb-3">
                        Problem
                      </div>
                      <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
                        {item.problem}
                      </p>
                    </div>

                    <div className="hidden lg:flex items-center justify-center">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full glass-system flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2 sm:mb-3">
                        FormaOS Solution
                      </div>
                      <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-medium">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </FadeInView>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* Custom Frameworks CTA - Info variant with high intensity */}
      <SystemBackground variant="info" intensity="high" className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInView>
            <GlassCard 
              variant="intense" 
              glow 
              glowColor="purple" 
              className="p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <GradientMesh animate={true} />
              </div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.slow }}
                  className="inline-flex items-center gap-2 glass-system rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 sm:mb-8"
                >
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  Custom Frameworks
                </motion.div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6">
                  Non-standard obligations or<br />
                  <span className="text-gradient-system-animated">internal governance requirements?</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Link 
                    href="/contact" 
                    className="group inline-flex items-center gap-2 btn btn-primary btn-premium text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-premium-xl w-full sm:w-auto justify-center"
                  >
                    Contact Sales
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/product" 
                    className="btn btn-secondary text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto text-center"
                  >
                    View Platform
                  </Link>
                </div>
              </div>
            </GlassCard>
          </FadeInView>
        </div>
      </SystemBackground>
    </div>
  );
}
