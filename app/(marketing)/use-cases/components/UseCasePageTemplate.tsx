'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';
import { SectionHeader, Reveal, VisualDivider } from '@/components/motion';
import { GlassCard, HoverLift } from '@/components/motion/EnhancedMotion';
import { DeferredSection } from '../../components/shared';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export interface UseCaseChallenge {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface UseCaseWorkflow {
  title: string;
  description: string;
  steps?: string[];
}

export interface UseCaseStandard {
  name: string;
  description?: string;
  features: string[];
}

export interface UseCaseMetric {
  value: string;
  label: string;
  description?: string;
}

interface UseCasePageTemplateProps {
  badge: string;
  badgeIcon?: ReactNode;
  title: ReactNode;
  description: string;
  challenges: UseCaseChallenge[];
  demoTitle?: string;
  demoDescription?: string;
  demoSlot: ReactNode;
  workflows: UseCaseWorkflow[];
  standards: UseCaseStandard[];
  metrics: UseCaseMetric[];
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
}

export function UseCasePageTemplate({
  badge,
  badgeIcon,
  title,
  description,
  challenges,
  demoTitle = 'Interactive workflow preview',
  demoDescription = 'See how controls, owners, and evidence stay connected in one operational system.',
  demoSlot,
  workflows,
  standards,
  metrics,
  ctaTitle,
  ctaDescription,
  ctaPrimaryLabel = 'Start Free Trial',
  ctaPrimaryHref = `${appBase}/auth/signup`,
  ctaSecondaryLabel = 'Schedule Demo',
  ctaSecondaryHref = '/contact',
}: UseCasePageTemplateProps) {
  return (
    <MarketingPageShell>
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <Reveal variant="fadeInUp">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
            {badgeIcon ?? <ShieldCheck className="h-4 w-4" />}
            {badge}
          </div>
        </Reveal>
        <Reveal variant="fadeInUp" delay={0.1}>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </Reveal>
        <Reveal variant="fadeInUp" delay={0.2}>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {description}
          </p>
        </Reveal>
      </section>

      <VisualDivider />

      <DeferredSection minHeight={460}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Common Challenges"
            title="Where compliance operations typically break down"
            subtitle="Challenges vary by environment, but the failure modes are consistent: ownership gaps, weak evidence chains, and manual reconstruction."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((item, idx) => (
              <ScrollReveal
                key={item.title}
                variant={idx % 2 === 0 ? 'fadeLeft' : 'fadeRight'}
                range={[0, 0.3 + idx * 0.05]}
              >
                <HoverLift>
                  <GlassCard intensity="normal" className="h-full p-6">
                    <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {item.description}
                    </p>
                  </GlassCard>
                </HoverLift>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      <DeferredSection minHeight={520}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeader badge="Interactive Demo" title={demoTitle} subtitle={demoDescription} />
          <div className="grid gap-5 lg:grid-cols-2">{demoSlot}</div>
        </section>
      </DeferredSection>

      <VisualDivider />

      <DeferredSection minHeight={600}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Operational Workflows"
            title="Execution model"
            subtitle="Run compliance through explicit workflows so tasks, approvals, and evidence remain connected."
          />
          <div className="space-y-4">
            {workflows.map((workflow, idx) => (
              <ScrollReveal
                key={workflow.title}
                variant="slideUp"
                range={[0, 0.3 + idx * 0.05]}
              >
                <GlassCard intensity="normal" className="p-6">
                  <h3 className="text-lg font-semibold text-white">{workflow.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">{workflow.description}</p>
                  {workflow.steps && workflow.steps.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      {workflow.steps.map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      <DeferredSection minHeight={560}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Mapped Standards"
            title="Framework and control coverage"
            subtitle="Maintain audit-ready evidence against the standards your teams are accountable for."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {standards.map((standard, idx) => (
              <ScrollReveal
                key={standard.name}
                variant={idx % 2 === 0 ? 'fadeLeft' : 'fadeRight'}
                range={[0, 0.3 + idx * 0.05]}
              >
                <GlassCard className="h-full p-6" intensity="subtle">
                  <h3 className="text-lg font-semibold text-white">{standard.name}</h3>
                  {standard.description && (
                    <p className="mt-2 text-sm text-slate-300">{standard.description}</p>
                  )}
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {standard.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      <DeferredSection minHeight={380}>
        <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Measured Impact"
            title="Expected operational outcomes"
            subtitle="Representative outcomes from teams moving compliance from periodic projects to daily operations."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <ScrollReveal
                key={metric.label}
                variant="scaleUp"
                range={[0, 0.3 + idx * 0.04]}
              >
                <GlassCard className="h-full p-6 text-center" intensity="strong">
                  <div className="text-3xl font-bold text-white">{metric.value}</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-cyan-200">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <p className="mt-3 text-xs text-slate-300">{metric.description}</p>
                  )}
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <GlassCard intensity="intense" glow className="p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">{ctaDescription}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ctaPrimaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
            >
              {ctaPrimaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ctaSecondaryHref}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {ctaSecondaryLabel}
            </Link>
          </div>
        </GlassCard>
      </section>
    </MarketingPageShell>
  );
}

export default UseCasePageTemplate;
