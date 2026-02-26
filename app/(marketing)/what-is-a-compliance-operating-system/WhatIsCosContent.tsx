'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionHeader, VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { GlassCard, HoverLift } from '@/components/motion/EnhancedMotion';
import { DeferredSection, MarketingPageShell } from '../components/shared';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export default function WhatIsCosContent() {
  return (
    <MarketingPageShell>
      <ImmersiveHero
        theme="product"
        badge={{ icon: <BookOpen className="h-4 w-4" />, text: 'Definition' }}
        headline={
          <>
            What Is a{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Compliance Operating System
            </span>
            ?
          </>
        }
        subheadline="A compliance operating system is operational infrastructure that turns regulatory obligations into executable workflows, continuous evidence capture, and real-time audit readiness."
        primaryCta={{ href: '/product', label: 'See FormaOS in Action' }}
        secondaryCta={{ href: `${appBase}/auth/signup`, label: 'Start Free Trial' }}
      />

      <VisualDivider />

      {/* Core definition */}
      <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
          <div className="space-y-6 text-base leading-relaxed text-slate-300">
            <p>
              A <strong className="text-white">compliance operating system</strong> is a category of software that goes beyond traditional governance, risk, and compliance (GRC) tools. While GRC platforms manage compliance documentation — policies, risk registers, and audit checklists — a compliance operating system <em>runs</em> your compliance program as an integral part of daily operations.
            </p>
            <p>
              Think of it like this: a word processor helps you write policies. A project management tool helps you assign tasks. A compliance operating system connects policies to tasks, tasks to evidence, evidence to controls, and controls to regulatory requirements — creating a continuous, defensible chain of accountability.
            </p>
            <p>
              The shift from compliance documentation to compliance operations represents a fundamental change in how organizations approach regulatory obligations. Instead of treating compliance as a periodic project (annual audits, quarterly reviews, pre-assessment preparation), a compliance operating system makes compliance a natural output of how your organization works every day.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <VisualDivider gradient={false} />

      {/* Key characteristics */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Core Capabilities"
            title="What makes it an operating system"
            subtitle="A compliance operating system has five defining characteristics that distinguish it from traditional compliance tools."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {[
              {
                title: 'Framework-to-workflow mapping',
                description: 'Regulatory requirements and compliance frameworks are mapped directly to operational workflows — not just documented. Each control has an owner, a process, and evidence requirements that connect to daily operations.',
              },
              {
                title: 'Continuous evidence capture',
                description: 'Evidence is generated automatically as work happens. Task completions, approvals, policy acknowledgments, and control verifications create immutable evidence records without separate collection effort.',
              },
              {
                title: 'Immutable audit trails',
                description: 'Every action is logged with full context — who, what, when, and why — in append-only records that cannot be modified after creation. This creates a tamper-evident chain that auditors trust.',
              },
              {
                title: 'Control ownership and accountability',
                description: 'Every control has an explicit owner responsible for its execution. Ownership isn\'t assumed or implied — it\'s enforced through the system, creating clear lines of accountability.',
              },
              {
                title: 'Real-time compliance visibility',
                description: 'Compliance status is visible in real-time, not discovered during periodic reviews. Gaps are identified as they emerge, not months later during audit preparation.',
              },
              {
                title: 'Multi-framework support',
                description: 'A single operational system supports multiple compliance frameworks simultaneously. Controls that satisfy requirements across ISO 27001, SOC 2, NDIS, and other frameworks share evidence and reduce duplication.',
              },
            ].map((item, idx) => (
              <ScrollReveal key={item.title} variant="scaleUp" range={[0, 0.3 + idx * 0.04]}>
                <HoverLift>
                  <GlassCard intensity="normal" className="h-full p-6">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
                  </GlassCard>
                </HoverLift>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Comparison: Compliance OS vs Traditional */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Comparison"
            title="Compliance operating system vs traditional approaches"
            subtitle="How operational compliance compares to GRC tools, spreadsheets, and document management."
          />
          <div className="mt-8 overflow-x-auto">
            <GlassCard intensity="normal" className="p-0 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-slate-400 font-medium">Capability</th>
                    <th className="px-6 py-4 text-cyan-300 font-semibold">Compliance OS</th>
                    <th className="px-6 py-4 text-slate-400 font-medium">GRC / Spreadsheets</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Compliance model', formaos: 'Continuous operational execution', traditional: 'Periodic documentation and review' },
                    { feature: 'Evidence collection', formaos: 'Automatic, real-time capture', traditional: 'Manual, retroactive gathering' },
                    { feature: 'Audit readiness', formaos: 'Always ready, generate on demand', traditional: 'Requires weeks of preparation' },
                    { feature: 'Control execution', formaos: 'Enforced through workflows', traditional: 'Documented but not enforced' },
                    { feature: 'Accountability', formaos: 'Explicit ownership with tracking', traditional: 'Assigned but not verified' },
                    { feature: 'Multi-framework', formaos: 'Unified controls, shared evidence', traditional: 'Separate tracking per framework' },
                    { feature: 'Compliance gaps', formaos: 'Detected in real-time', traditional: 'Found during periodic reviews' },
                    { feature: 'Staff impact', formaos: 'Embedded in daily workflows', traditional: 'Separate compliance activities' },
                  ].map((row, idx, arr) => (
                    <tr key={row.feature} className={idx < arr.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="px-6 py-4 text-white font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-emerald-300">{row.formaos}</td>
                      <td className="px-6 py-4 text-slate-400">{row.traditional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Who needs it */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Use Cases"
            title="Who needs a compliance operating system?"
          />
          <div className="mt-8 space-y-6">
            {[
              {
                industry: 'Healthcare organizations',
                description: 'Hospitals, clinics, and aged care providers managing NSQHS Standards, AHPRA requirements, clinical governance, and accreditation readiness across multiple sites and services.',
              },
              {
                industry: 'Disability service providers',
                description: 'NDIS registered providers managing Practice Standards, Quality Indicators, incident reporting, worker screening, and Commission audit requirements.',
              },
              {
                industry: 'Technology companies',
                description: 'SaaS companies and cloud service providers pursuing SOC 2 Type II certification or ISO 27001 compliance to meet enterprise customer requirements.',
              },
              {
                industry: 'Financial services',
                description: 'Regulated financial organizations managing compliance across APRA, ASIC, AML/CTF, and industry-specific requirements with complex control environments.',
              },
              {
                industry: 'Government agencies',
                description: 'Public sector organizations managing compliance across multiple regulatory frameworks while maintaining transparency and audit readiness for oversight bodies.',
              },
            ].map((item, idx) => (
              <ScrollReveal key={item.industry} variant="fadeUp" range={[0, 0.25 + idx * 0.04]}>
                <GlassCard intensity="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-white">{item.industry}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Evolution section */}
      <DeferredSection minHeight={300}>
        <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
            <div className="space-y-6 text-base leading-relaxed text-slate-300">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">The evolution of compliance technology</h2>
              <p>
                Compliance technology has evolved through three generations. The first generation was <strong className="text-white">document management</strong> — storing policies and procedures in shared drives and intranets. The second generation was <strong className="text-white">GRC platforms</strong> — tracking risks, controls, and audit findings in structured databases with workflow capabilities.
              </p>
              <p>
                The third generation is the <strong className="text-white">compliance operating system</strong>. It doesn&apos;t just store compliance information or track compliance activities — it embeds compliance into the operational fabric of the organization. The difference is like the difference between a recipe book and a commercial kitchen: one describes what should happen, the other makes it happen reliably at scale.
              </p>
              <p>
                This evolution matters because regulatory complexity is increasing, not decreasing. Organizations face more frameworks, more oversight, and higher expectations for evidence quality. The only sustainable approach is making compliance a natural output of operations — not a separate workstream that competes with operational delivery.
              </p>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* FAQ section */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader badge="FAQ" title="Common questions about compliance operating systems" />
          <div className="mt-8 space-y-6">
            {[
              { question: 'What is a compliance operating system?', answer: 'A compliance operating system is operational infrastructure that turns regulatory obligations into executable workflows with continuous evidence capture and real-time audit readiness. Unlike traditional GRC tools that manage documents and checklists, a compliance OS runs your compliance program as part of daily operations.' },
              { question: 'How is a compliance operating system different from GRC software?', answer: 'GRC software focuses on governance documentation, risk registers, and compliance checklists. A compliance operating system goes further by embedding compliance into operational workflows — turning requirements into executable processes that capture evidence automatically as work happens.' },
              { question: 'Who needs a compliance operating system?', answer: 'Any organization that must demonstrate compliance to regulators, auditors, or accreditation bodies. This includes healthcare providers, disability service organizations, financial services firms, technology companies pursuing SOC 2 or ISO certification, and government agencies.' },
              { question: 'What are the benefits over spreadsheets?', answer: 'A compliance operating system eliminates manual evidence gathering, ensures continuous audit readiness, connects controls to operational workflows, and provides immutable audit trails. Spreadsheets create compliance gaps, lack accountability, and require periodic reconstruction of evidence.' },
            ].map((item, idx) => (
              <ScrollReveal key={item.question} variant="fadeUp" range={[0, 0.25 + idx * 0.04]}>
                <GlassCard intensity="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.answer}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Related links */}
      <DeferredSection minHeight={200}>
        <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader badge="Explore" title="Dive deeper" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'FormaOS Platform', href: '/product', description: 'See the compliance operating system in action.' },
              { label: 'ISO 27001 Compliance', href: '/iso-compliance-software', description: 'How FormaOS automates ISO compliance.' },
              { label: 'SOC 2 Automation', href: '/soc2-compliance-automation', description: 'Continuous SOC 2 Type II compliance.' },
              { label: 'NDIS Compliance', href: '/ndis-compliance-system', description: 'Purpose-built for disability service providers.' },
              { label: 'Healthcare Compliance', href: '/healthcare-compliance-platform', description: 'Clinical governance and accreditation.' },
              { label: 'Audit Evidence', href: '/audit-evidence-management', description: 'Immutable evidence capture and management.' },
            ].map((link) => (
              <HoverLift key={link.href}>
                <Link href={link.href} className="block h-full">
                  <GlassCard intensity="normal" className="h-full p-5">
                    <h4 className="text-sm font-semibold text-white">{link.label}</h4>
                    <p className="mt-2 text-xs text-slate-400">{link.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300">
                      Learn more <ArrowRight className="h-3 w-3" />
                    </span>
                  </GlassCard>
                </Link>
              </HoverLift>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <GlassCard intensity="intense" glow className="p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            See the compliance operating system in action
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            FormaOS is the compliance operating system for regulated organizations. Turn regulatory obligations into structured controls, owned actions, and immutable audit evidence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`${appBase}/auth/signup`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore Platform
            </Link>
          </div>
        </GlassCard>
      </section>
    </MarketingPageShell>
  );
}
