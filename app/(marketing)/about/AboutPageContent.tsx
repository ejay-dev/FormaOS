'use client';

import { ArrowRight, Users, Target, Lightbulb, AlertTriangle, Building2, Shield, CheckCircle, Code2, Layers, Zap, Eye, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import dynamic from 'next/dynamic';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { InteractiveGlobe } from '@/components/marketing/InteractiveGlobe';
import { EnterpriseShaderHero } from '@/components/marketing/EnterpriseShaderHero';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';

const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

function AboutHeroGlobeVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      <div className="pointer-events-auto absolute right-[clamp(1.25rem,3vw,4rem)] top-[62%] -translate-y-1/2">
        <div className="relative h-[560px] w-[560px] xl:h-[700px] xl:w-[700px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14)_0%,rgba(14,165,233,0.04)_50%,transparent_74%)]" />
          <InteractiveGlobe
            size={700}
            className="h-full w-full opacity-82"
            autoRotateSpeed={0.0016}
            dotColor="rgba(167,139,250, ALPHA)"
            arcColor="rgba(99,102,241, 0.35)"
            markerColor="rgba(125,211,252, 0.95)"
          />
        </div>
      </div>
    </div>
  );
}

function AboutHero() {
  return (
    <ImmersiveHero
      theme="about"
      visualContent={<AboutHeroGlobeVisual />}
      visualInteractive
      badge={{ icon: <Users className="w-4 h-4 text-violet-400" />, text: 'About FormaOS', colorClass: 'violet' }}
      headline={<>Compliance infrastructure<br /><span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">built for accountability</span></>}
      subheadline="FormaOS was built for regulated teams where compliance failure has real consequences — and where leadership needs more than a spreadsheet to prove they're in control."
      primaryCta={{ href: '/our-story', label: 'Read Our Story' }}
      secondaryCta={{ href: '/product', label: 'See How It Works' }}
    />
  );
}

const milestones = [
  {
    year: '2022',
    title: 'Problem identified',
    detail: 'After years working inside regulated organizations, the founding team recognized a structural gap: compliance tools stored documents, but none enforced execution. The concept for a compliance operating system was born.',
  },
  {
    year: '2023',
    title: 'First regulated deployment',
    detail: 'FormaOS deployed with its first NDIS provider — 400+ staff across multiple states. The platform proved that compliance could run as operational workflow with named ownership and defensible evidence.',
  },
  {
    year: '2024',
    title: 'Healthcare and multi-framework expansion',
    detail: 'AHPRA credential tracking, NSQHS Standards mapping, and ISO 27001 frameworks went live. Multi-entity support and SAML 2.0 SSO launched for enterprise identity governance.',
  },
  {
    year: '2025',
    title: 'Enterprise-grade infrastructure',
    detail: 'Data residency controls (AU/US/EU), SCIM provisioning, APRA CPS 234 framework support, and the full enterprise procurement package — DPA, vendor assurance, SLA, and security review packet.',
  },
] as const;

const values = [
  {
    icon: Eye,
    title: 'Transparency over promises',
    detail: 'We ship the security review packet before your procurement team asks for it. Our architecture, encryption, and controls are documented and available — not hidden behind an NDA wall.',
  },
  {
    icon: Layers,
    title: 'Infrastructure over features',
    detail: 'We build compliance infrastructure — not a feature checklist. Every capability connects to the operating model: controls link to evidence, evidence links to owners, owners link to audit trails.',
  },
  {
    icon: Zap,
    title: 'Execution over documentation',
    detail: 'Documentation without execution is liability. FormaOS enforces compliance as work: tasks with deadlines, evidence with verification, controls with named owners — not PDFs in a folder.',
  },
  {
    icon: Award,
    title: 'Accountability over aspiration',
    detail: 'We build for organizations where compliance failure has real consequences — sanctions, registration loss, enforcement actions. Our platform is designed for the teams regulators hold accountable.',
  },
] as const;

export default function AboutPageContent() {
  return (
    <MarketingPageShell>
      <AboutHero />

      <VisualDivider gradient />

      <DeferredSection minHeight={640}>
        <EnterpriseShaderHero
          badgeText="Compliance Execution Network"
          headline={{
            line1: 'Operational Signal',
            line2: 'Across Every Control Surface',
          }}
          subtitle="A live strategic view of how governance, evidence, and accountability stay synchronized for regulated teams operating at enterprise scale."
          primaryCta={{ href: '/product', label: 'Explore Product' }}
          secondaryCta={{ href: '/contact', label: 'Book Walkthrough' }}
          className="pt-10 sm:pt-12 pb-8 sm:pb-10"
        />
      </DeferredSection>

      <VisualDivider />

      {/* Founder Origin Story */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Built by operators, for operators
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="slideUp" range={[0.05, 0.35]}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 sm:p-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="rounded-xl border border-teal-400/20 bg-teal-500/10 p-3 shrink-0">
                    <Code2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Ejaz Hussain</h3>
                    <p className="text-sm text-teal-400/70">Founder & CEO</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    FormaOS didn&apos;t start as a product idea. It started as frustration. After years building technology
                    for regulated organizations — healthcare networks, NDIS providers, financial services firms — the same
                    pattern emerged everywhere: compliance teams managing critical obligations in spreadsheets, shared drives,
                    and email threads. Evidence scattered. Ownership unclear. Audit preparation consuming weeks that should
                    have been hours.
                  </p>
                  <p>
                    The tools available solved storage — not execution. They could hold documents, but they couldn&apos;t enforce
                    accountability. They could generate reports, but they couldn&apos;t prove who owned what, when it was verified,
                    or whether the work actually happened. When regulators arrived, teams scrambled to reconstruct timelines
                    that should have been captured automatically.
                  </p>
                  <p>
                    FormaOS was built to close that gap. Not as another document repository or checklist tool, but as a
                    compliance operating system — infrastructure that connects obligations to controls, controls to owners,
                    owners to evidence, and evidence to defensible audit trails. The system regulators expect, built the way
                    engineers think about systems: structured, traceable, and continuously operational.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Company Timeline */}
      <DeferredSection minHeight={350}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Company Timeline
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                From identifying the compliance execution gap to deploying enterprise infrastructure across regulated sectors.
              </p>
            </ScrollReveal>

            <SectionChoreography pattern="cascade" stagger={0.06} className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/30 via-teal-400/10 to-transparent" />

              <div className="space-y-8">
                {milestones.map((milestone, i) => (
                  <div key={milestone.year} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    {/* Timeline dot */}
                    <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-teal-400 border-2 border-[#0a0f1c] z-10" />

                    {/* Content card */}
                    <div className={`ml-12 sm:ml-0 sm:w-[calc(50%-2rem)] ${i % 2 === 0 ? '' : 'sm:ml-auto'}`}>
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 hover:border-teal-400/15 hover:bg-white/[0.06] transition-all duration-200">
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">{milestone.year}</div>
                        <h3 className="text-base font-semibold text-white mb-2">{milestone.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{milestone.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Mission & Purpose */}
      <DeferredSection minHeight={300}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Why FormaOS Exists
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Regulated organizations face a structural gap: governance requirements that grow faster than the tools available to meet them.
              </p>
            </ScrollReveal>

            <SectionChoreography pattern="alternating" stagger={0.06} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 hover:border-teal-400/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl border border-teal-400/20 bg-teal-500/10 flex items-center justify-center mb-6">
                    <Target className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Mission
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Deliver operational clarity for regulated industries by connecting controls, evidence, and accountability in a single compliance operating system.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 hover:border-teal-400/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl border border-teal-400/20 bg-teal-500/10 flex items-center justify-center mb-6">
                    <Lightbulb className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Why it matters
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Regulators expect defensible evidence, not just documentation. FormaOS provides the audit trail and proof required to protect leadership teams and their organizations.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 hover:border-teal-400/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl border border-teal-400/20 bg-teal-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    The problem we solve
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Compliance teams are stuck managing obligations across spreadsheets, shared drives, and disconnected tools — with no single source of truth when auditors arrive.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 hover:border-teal-400/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl border border-teal-400/20 bg-teal-500/10 flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Our commitment
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    FormaOS is built for the organizations where compliance failure has real consequences — clinical, financial, reputational. We take that accountability seriously.
                  </p>
                </div>
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Values */}
      <DeferredSection minHeight={300}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What We Stand For
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                These aren&apos;t aspirational values on a poster. They&apos;re engineering decisions that shape every feature we ship.
              </p>
            </ScrollReveal>

            <SectionChoreography pattern="cascade" stagger={0.05} className="grid md:grid-cols-2 gap-5">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 hover:border-teal-400/15 hover:bg-white/[0.06] transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg border border-teal-400/20 bg-teal-500/10 p-2.5 shrink-0">
                        <Icon className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-2">{value.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{value.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Proof Points */}
      <DeferredSection minHeight={200}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Operational Proof, Not Promises
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm">
                These are the outcomes regulated teams achieve when compliance runs as infrastructure.
              </p>
            </ScrollReveal>
            <SectionChoreography pattern="cascade" stagger={0.04} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stat: '< 2 min', label: 'Audit packet export', detail: 'Framework-mapped evidence bundles generated on demand — no manual reconstruction' },
                { stat: '9', label: 'Pre-built frameworks', detail: 'ISO 27001, SOC 2, NDIS, NSQHS, RACGP, Essential Eight, HIPAA, GDPR, PCI-DSS' },
                { stat: '100%', label: 'Control ownership', detail: 'Every control has a named owner, review cadence, and evidence trail — no orphaned obligations' },
                { stat: '~90%', label: 'Audit prep reduction', detail: 'Teams reduce audit preparation from weeks to hours with continuous compliance posture' },
              ].map(({ stat, label, detail }) => (
                <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-teal-400 mb-1">{stat}</div>
                  <div className="text-sm font-semibold text-white mb-2">{label}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Who We Serve */}
      <DeferredSection minHeight={350}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Who We Serve
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm">
                FormaOS is purpose-built for organizations operating in regulated environments where accountability is mandatory, not aspirational.
              </p>
            </ScrollReveal>
            <SectionChoreography pattern="cascade" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Healthcare Providers', icon: Building2, regulators: 'AHPRA, NSQHS, RACGP, Privacy Act', detail: 'Clinical governance, credentialing, incident response, and accreditation evidence' },
                { label: 'NDIS & Aged Care', icon: Users, regulators: 'NDIS Commission, Aged Care Quality & Safety Commission', detail: 'Practice standards compliance, SIRS reportable incidents, worker screening' },
                { label: 'Financial Services', icon: CheckCircle, regulators: 'ASIC, APRA, AUSTRAC, AML/CTF Act', detail: 'Regulatory breach reporting, CPS 234 controls, board governance evidence' },
                { label: 'Government Bodies', icon: Shield, regulators: 'PSPF, ISM, Essential Eight, Privacy Act', detail: 'Protective security obligations, information security controls, audit readiness' },
                { label: 'Education & Workforce', icon: CheckCircle, regulators: 'ACECQA, NQF, WWC, SafeWork', detail: 'Quality framework compliance, workforce credentials, WHS obligations' },
                { label: 'Technology & SaaS', icon: Shield, regulators: 'ISO 27001, SOC 2, GDPR, HIPAA', detail: 'Information security governance, vendor assurance, continuous compliance' },
              ].map(({ label, icon: Icon, regulators, detail }) => (
                <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 hover:border-teal-400/15 hover:bg-white/[0.06] transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg border border-teal-400/20 bg-teal-500/10 p-2.5">
                      <Icon className="w-4 h-4 text-teal-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{label}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{detail}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-teal-400/70">{regulators}</p>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Live Activity Feed */}
      <DeferredSection minHeight={300}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-8"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                The Audit Trail Never Lies
              </h3>
              <p className="text-sm text-gray-400">
                Every action timestamped, attributed, and preserved — exactly as regulators expect
              </p>
            </ScrollReveal>
            <ScrollReveal variant="depthSlide" range={[0.04, 0.34]}>
              <DemoAuditTrailCard
                glowColor="from-purple-500/15 to-pink-500/15"
                entries={[
                  {
                    action: 'Audit packet exported',
                    user: 'Sarah Chen',
                    target: 'SOC 2 Type II — Q4 2025',
                    time: '09:47',
                    type: 'compliance',
                  },
                  {
                    action: 'Policy approved',
                    user: 'Marcus Rivera',
                    target: 'Data Retention Policy v3.0',
                    time: '09:14',
                    type: 'policy',
                  },
                  {
                    action: 'Evidence uploaded',
                    user: 'Emma Rodriguez',
                    target: 'ISO 27001 A.12.1.3 — Capacity Management',
                    time: '08:42',
                    type: 'evidence',
                  },
                  {
                    action: 'Risk assessed',
                    user: 'James Wilson',
                    target: 'Third-Party Vendor Security Review',
                    time: '08:15',
                    type: 'compliance',
                  },
                  {
                    action: 'Control verified',
                    user: 'Priya Nair',
                    target: 'HIPAA § 164.312(a)(1) — Access Control',
                    time: '07:58',
                    type: 'task',
                  },
                  {
                    action: 'Control mapped',
                    user: 'System',
                    target: 'NDIS Practice Standard 4.2 — Incident Management',
                    time: '07:30',
                    type: 'system',
                  },
                ]}
              />
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* CTA Section */}
      <DeferredSection minHeight={250}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-teal-400 font-semibold mb-3">
                      Ready to evaluate?
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      See the compliance operating system in action
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      We work with regulated operators who need certainty, defensible evidence, and the operational infrastructure to prove it. Request a demo or start a trial today.
                    </p>
                  </div>
                  <motion.a
                    href="/contact"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 40px rgba(20, 184, 166, 0.4)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all whitespace-nowrap"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
