'use client';

import {
  ArrowRight,
  Users,
  Target,
  Lightbulb,
  AlertTriangle,
  Building2,
  Shield,
  CheckCircle,
  Layers,
  Zap,
  Eye,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import dynamic from 'next/dynamic';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';
import {
  AUTOMATED_EVALUATOR_COUNT,
  DISTINCT_FRAMEWORK_COUNT,
  DISTINCT_FRAMEWORK_NAMES,
  EVALUATOR_COUNT,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  MANUAL_ATTESTATION_COUNT,
} from '@/lib/marketing/claims';

const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

/* No hero badge and no globe: this is a one-person product built in
   Adelaide for Australian providers, and a rotating world map said the
   opposite. The founder story carries the page instead. */
function AboutHero() {
  return (
    <ImmersiveHero
      theme="about"
      headline={
        <>
          Compliance infrastructure
          <br />
          <span className="text-foreground">built for accountability</span>
        </>
      }
      subheadline="Written in Adelaide since 2022, for regulated teams who need more than a spreadsheet to prove they are in control."
      primaryCta={{
        href: compliancePlanHref('about_hero'),
        label: PUBLIC_CTA_LABELS.compliancePlan,
      }}
      secondaryCta={{ href: '/product', label: 'See how it works' }}
    />
  );
}

const values = [
  {
    icon: Eye,
    title: 'Transparency over promises',
    detail:
      'Security review material is available early in evaluation. The architecture, encryption, and operating controls are documented plainly, and anything restricted is handled deliberately rather than oversold in public copy.',
  },
  {
    icon: Layers,
    title: 'Infrastructure over features',
    detail:
      'This is compliance infrastructure, not a feature checklist. Every capability connects to the operating model: controls link to evidence, evidence links to owners, owners link to audit trails.',
  },
  {
    icon: Zap,
    title: 'Execution over documentation',
    detail:
      'Documentation without execution is liability. FormaOS enforces compliance as work: tasks with deadlines, evidence with verification, controls with named owners, not PDFs in a folder.',
  },
  {
    icon: Award,
    title: 'Accountability over aspiration',
    detail:
      'FormaOS is built for organisations where compliance failure has real consequences: sanctions, registration loss, enforcement action. It is designed for the teams regulators hold accountable.',
  },
] as const;

export default function AboutPageContent() {
  return (
    <MarketingPageShell>
      <AboutHero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Founder Origin Story */}
      <DeferredSection minHeight={220}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-10"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                Why an engineer built this
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="slideUp" range={[0.05, 0.35]}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10 lg:items-start">
                  {/* Founder photo. Source is 499×1023 (≈1:2 portrait);
                      frame uses aspect-[1/2] + object-top so the face
                      stays anchored at the top instead of getting cropped
                      by a default centre-crop. <img> falls back to the
                      "EH" initials tile if the binary 404s. */}
                  <div className="relative mx-auto aspect-[1/2] w-full max-w-[240px] lg:mx-0">
                    <div
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]"
                    >
                      <span className="font-display text-5xl font-semibold tracking-tight text-white/40">
                        EH
                      </span>
                    </div>
                    <img
                      src="/team/founder.jpeg"
                      alt="Portrait of Ejaz Hussain, founder of FormaOS"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="relative h-full w-full rounded-2xl border border-white/[0.08] object-cover object-top"
                    />
                  </div>

                  <div>
                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-white">
                        Ejaz Hussain
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        Founder &amp; Chief Engineer
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Adelaide · building FormaOS since 2022
                      </p>
                    </div>

                    <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                      <p>
                        FormaOS is my first project in compliance
                        infrastructure. I&apos;ve been writing it from Adelaide
                        since 2022, fitting it around freelance work: websites
                        and web apps for whoever was paying that month. FormaOS
                        was always the bigger thing, the one I actually cared
                        about. I just needed the freelance to fund the runway.
                      </p>
                      <p>
                        Compliance picked me as much as I picked it. Australian
                        regulators have spent the past decade tightening
                        expectations on NDIS providers, aged-care operators,
                        healthcare networks, and AFS licensees. The software
                        answering that pressure has, almost without exception,
                        stayed at the level of a document repository with a
                        workflow tab on top. I kept looking at it and thinking
                        the actual problem was an engineering one. There was no
                        executable layer connecting an obligation to a control
                        to a task to a piece of evidence to an auditor who could
                        verify any of it. Nobody was building that. So I
                        started.
                      </p>
                      <p>
                        Today FormaOS ships {EVALUATOR_COUNT} control evaluators
                        across {FRAMEWORK_PACK_COUNT} framework packs covering{' '}
                        {DISTINCT_FRAMEWORK_COUNT} standards:{' '}
                        {DISTINCT_FRAMEWORK_NAMES.join(', ')}. Of those,{' '}
                        {AUTOMATED_EVALUATOR_COUNT} evaluate automatically
                        against your live data and the other{' '}
                        {MANUAL_ATTESTATION_COUNT} are surfaced as human
                        attestations, labelled as such. The audit log is
                        hash-chained in Postgres, with append-only enforced at
                        the database layer by an immutability trigger and RLS
                        deny policies, not application code, and the chain head
                        anchors daily at 05:30 UTC to Sigstore Rekor, the same
                        transparency log the Linux Foundation uses for signed
                        open-source releases. It&apos;s bootstrapped,
                        sole-engineered, AU-hosted. The roadmap is short on
                        purpose.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Timeline section removed 2026-05-28, the previous milestone
          array claimed customer deployments and framework launches
          that hadn't actually shipped. Pulled the whole section
          rather than fabricate a four-year history. /about flows hero
          → founder card → values → mission now. */}

      {/* Mission & Purpose */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Why FormaOS exists
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Regulated organisations face a structural gap: governance
                requirements that grow faster than the tools available to meet
                them.
              </p>
            </ScrollReveal>

            <SectionChoreography
              pattern="alternating"
              stagger={0.06}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center mb-4 sm:mb-6">
                  <Target className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">The goal</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Operational clarity for regulated industries: controls,
                  evidence, and accountability connected in one compliance
                  operating system.
                </p>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center mb-6">
                  <Lightbulb className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Why it matters
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Regulators expect defensible evidence, not just documentation.
                  FormaOS provides the audit trail and proof required to protect
                  leadership teams and their organisations.
                </p>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center mb-6">
                  <AlertTriangle className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  The problem it solves
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Compliance teams are stuck managing obligations across
                  spreadsheets, shared drives, and disconnected tools, with no
                  single source of truth when auditors arrive.
                </p>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  The commitment
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  FormaOS is built for the organisations where compliance
                  failure has real consequences: clinical, financial,
                  reputational. That accountability sets the bar for what ships.
                </p>
              </div>
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Values */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What this is built on
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                These are not aspirational values on a poster. They are the
                engineering decisions that shape what ships.
              </p>
            </ScrollReveal>

            <SectionChoreography
              pattern="cascade"
              stagger={0.05}
              className="grid md:grid-cols-2 gap-5"
            >
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2.5 shrink-0">
                        <Icon className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white mb-2">
                          {value.title}
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {value.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Proof Points */}
      <DeferredSection minHeight={160}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                What ships today
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto text-sm">
                Counts from the running product, not customer outcomes. There
                are no deployments to report yet, and every number here can be
                checked in the product during evaluation.
              </p>
            </ScrollReveal>
            <SectionChoreography
              pattern="cascade"
              stagger={0.04}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                {
                  stat: String(FRAMEWORK_PACK_COUNT),
                  label: 'Framework packs',
                  detail: `Installable and scored, covering ${DISTINCT_FRAMEWORK_COUNT} distinct standards. SOC 2 ships as two packs, which is why the two numbers differ`,
                },
                {
                  stat: String(FRAMEWORK_CONTROL_COUNT),
                  label: 'Mapped controls',
                  detail:
                    'Each one carries its framework reference and the evidence it expects, so a gap is visible before an auditor finds it',
                },
                {
                  stat: String(AUTOMATED_EVALUATOR_COUNT),
                  label: 'Automated checks',
                  detail: `Evaluated against your live data. The remaining ${MANUAL_ATTESTATION_COUNT} evaluators need a person to attest, and say so on screen`,
                },
                {
                  stat: '05:30 UTC',
                  label: 'Daily chain anchor',
                  detail:
                    'The hash-chained audit log anchors its head to Sigstore Rekor every day, so an event can be verified without trusting us',
                },
              ].map(({ stat, label, detail }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-center"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {stat}
                  </div>
                  <div className="text-sm font-semibold text-white mb-2">
                    {label}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {detail}
                  </p>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Who We Serve */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Who it is built for
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto text-sm">
                FormaOS is built for organisations operating in regulated
                environments where accountability is mandatory, not
                aspirational.
              </p>
            </ScrollReveal>
            <SectionChoreography
              pattern="cascade"
              stagger={0.04}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {[
                {
                  label: 'Healthcare Providers',
                  icon: Building2,
                  regulators: 'AHPRA, NSQHS, RACGP, Privacy Act',
                  detail:
                    'Clinical governance, credentialing, incident response, and accreditation evidence',
                },
                {
                  label: 'NDIS & Aged Care',
                  icon: Users,
                  regulators:
                    'NDIS Commission, Aged Care Quality & Safety Commission',
                  detail:
                    'Practice standards compliance, SIRS reportable incidents, worker screening',
                },
                {
                  label: 'Financial Services',
                  icon: CheckCircle,
                  regulators: 'ASIC, APRA, AUSTRAC, AML/CTF Act',
                  detail:
                    'Regulatory breach reporting, CPS 234 controls, board governance evidence',
                },
                {
                  label: 'Government Bodies',
                  icon: Shield,
                  regulators: 'PSPF, ISM, Essential Eight, Privacy Act',
                  detail:
                    'Protective security obligations, information security controls, audit readiness',
                },
                {
                  label: 'Education & Workforce',
                  icon: CheckCircle,
                  regulators: 'ACECQA, NQF, WWC, SafeWork',
                  detail:
                    'Quality framework compliance, workforce credentials, WHS obligations',
                },
                {
                  label: 'Technology & SaaS',
                  icon: Shield,
                  regulators: 'ISO 27001, SOC 2, GDPR, HIPAA',
                  detail:
                    'Information security governance, vendor assurance, continuous compliance',
                },
              ].map(({ label, icon: Icon, regulators, detail }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2.5">
                      <Icon className="w-4 h-4 text-zinc-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {label}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    {detail}
                  </p>
                  <p className="text-xs text-zinc-500">{regulators}</p>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Live Activity Feed */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-8"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                The audit trail never lies
              </h3>
              <p className="text-sm text-zinc-400">
                Every action timestamped, attributed to a role, and preserved,
                exactly as regulators expect. Illustrative sample.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="depthSlide" range={[0.04, 0.34]}>
              <DemoAuditTrailCard
                glowColor="from-white/10 to-white/[0.04]"
                entries={[
                  {
                    action: 'Audit packet exported',
                    user: 'Compliance Lead',
                    target: 'SOC 2 Type II, Q4 2025',
                    time: '09:47',
                    type: 'compliance',
                  },
                  {
                    action: 'Policy approved',
                    user: 'Policy Owner',
                    target: 'Data Retention Policy v3.0',
                    time: '09:14',
                    type: 'policy',
                  },
                  {
                    action: 'Evidence uploaded',
                    user: 'Evidence Reviewer',
                    target: 'ISO 27001 A.12.1.3, Capacity Management',
                    time: '08:42',
                    type: 'evidence',
                  },
                  {
                    action: 'Risk assessed',
                    user: 'Risk Analyst',
                    target: 'Third-Party Vendor Security Review',
                    time: '08:15',
                    type: 'compliance',
                  },
                  {
                    action: 'Control verified',
                    user: 'Security Reviewer',
                    target: 'HIPAA § 164.312(a)(1), Access Control',
                    time: '07:58',
                    type: 'task',
                  },
                  {
                    action: 'Control mapped',
                    user: 'System',
                    target: 'NDIS Practice Standard 4.2, Incident Management',
                    time: '07:30',
                    type: 'system',
                  },
                ]}
              />
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* CTA Section */}
      <DeferredSection minHeight={200}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      See the compliance operating system in action
                    </h2>
                    <p className="text-zinc-400 leading-relaxed">
                      Request a scoped compliance plan and evaluate FormaOS
                      against your own operating requirements: your frameworks,
                      your controls, your evidence.
                    </p>
                  </div>
                  <motion.a
                    href={compliancePlanHref('about_final')}
                    whileTap={{ scale: 0.98 }}
                    className="group px-8 py-4 rounded-full bg-foreground text-background font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-all whitespace-nowrap w-full sm:w-auto"
                  >
                    <span>{PUBLIC_CTA_LABELS.compliancePlan}</span>
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
