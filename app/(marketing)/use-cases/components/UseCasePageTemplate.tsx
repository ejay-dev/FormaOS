'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { GlassCard, HoverLift } from '@/components/motion/EnhancedMotion';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { DeferredSection } from '../../components/shared';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';
import { UseCaseHeroVisual } from './UseCaseHeroVisual';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';

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
  industryKey: string;
  /** Optional grayscale photographic backdrop for the hero section */
  mediaSrc?: string;
}

const relatedLinksByIndustry: Record<
  string,
  { href: string; label: string; description: string }[]
> = {
  healthcare: [
    {
      href: '/compare/healthmetrics',
      label: 'Compare with HealthMetrics',
      description: 'See how operational healthcare workflows differ from a clinical-indicator reporting product.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Review buyer-facing assurance, evidence visibility, and procurement posture.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'Validate plan depth before moving into guided procurement.',
    },
  ],
  ndis_aged_care: [
    {
      href: '/compare/complispace',
      label: 'Compare with Ideagen Policy Logic',
      description: 'Contrast policy + training management with operational accountability in care delivery.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Show procurement and oversight reviewers current assurance posture.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'Review commercial fit and procurement support for provider teams.',
    },
  ],
  financial_services: [
    {
      href: '/compare/6clicks',
      label: 'Compare with 6clicks',
      description: 'Evaluate accountable control execution against a GRC-content-first alternative.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Inspect buyer-facing assurance and security review acceleration.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'See plan structure and enterprise procurement support.',
    },
  ],
  government_public_sector: [
    {
      href: '/compare/riskware',
      label: 'Compare with Riskware',
      description: 'Review how governance execution differs from a risk-register-led GRC platform.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Inspect evidence visibility and procurement trust posture for public-sector buyers.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'Validate plan fit and commercial path for public-sector procurement.',
    },
  ],
  incident_management: [
    {
      href: '/compare/riskware',
      label: 'Compare with Riskware',
      description: 'See why incident workflows need more than a traditional risk-register product.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Link incident readiness to buyer assurance and export-ready proof.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'Review rollout path and enterprise support for high-stakes incident programs.',
    },
  ],
  workforce_credentials: [
    {
      href: '/compare/complispace',
      label: 'Compare with Ideagen Policy Logic',
      description: 'Contrast credential governance with a policy + training management alternative.',
    },
    {
      href: '/trust',
      label: 'Trust Center',
      description: 'Show how workforce assurance connects to buyer and audit scrutiny.',
    },
    {
      href: '/pricing',
      label: 'Pricing',
      description: 'Evaluate commercial fit for ongoing credential governance programs.',
    },
  ],
};

/* Plain editorial section header — replaces the rotating-icon glass pill.
   `variant="rule"` renders a centred hairline-flanked label; `variant="label"`
   renders a quiet uppercase eyebrow. Headers are varied across the page so the
   layout never reads as a repeated template. */
function UseCaseSectionHeader({
  label,
  title,
  subtitle,
  variant = 'label',
}: {
  label: string;
  title: string;
  subtitle?: string;
  variant?: 'label' | 'rule';
}) {
  return (
    <ScrollReveal variant="slideUp" range={[0, 0.3]}>
      <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
        {variant === 'rule' ? (
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {label}
            </span>
            <span className="h-px w-8 bg-white/20" />
          </div>
        ) : (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
        )}
        <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </ScrollReveal>
  );
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
  ctaPrimaryLabel = PUBLIC_CTA_LABELS.compliancePlan,
  ctaPrimaryHref,
  ctaSecondaryLabel = PUBLIC_CTA_LABELS.seeDemo,
  ctaSecondaryHref,
  industryKey,
  mediaSrc,
}: UseCasePageTemplateProps) {
  const { trackCtaClick } = useMarketingTelemetry();
  const relatedLinks =
    relatedLinksByIndustry[industryKey] ?? relatedLinksByIndustry.healthcare;
  const primaryHref = ctaPrimaryHref ?? compliancePlanHref(`use_case_${industryKey}`);
  const secondaryHref = ctaSecondaryHref ?? demoHref(`use_case_${industryKey}`);

  return (
    <MarketingPageShell>
      <section className="relative isolate overflow-hidden">
        {mediaSrc && <SectionMedia src={mediaSrc} objectPosition="50% 35%" opacity={0.85} scrim="center" />}
        <ImmersiveHero
          theme="use-cases"
        visualContent={<UseCaseHeroVisual icon={badgeIcon ?? <ShieldCheck className="h-4 w-4" />} steps={workflows.slice(0, 4).map((w) => w.title)} />}
        badge={{
          icon: badgeIcon ?? <ShieldCheck className="h-4 w-4" />,
          text: badge,
        }}
        headline={title}
        subheadline={description}
        primaryCta={{ href: primaryHref, label: ctaPrimaryLabel }}
        secondaryCta={{ href: secondaryHref, label: ctaSecondaryLabel }}
        onPrimaryCtaClick={() =>
          trackCtaClick({
            surface: 'use_case',
            section: 'hero',
            location: 'hero_primary',
            ctaLabel: ctaPrimaryLabel,
            ctaHref: primaryHref,
            variant: 'primary',
            industry: industryKey,
          })
        }
        onSecondaryCtaClick={() =>
          trackCtaClick({
            surface: 'use_case',
            section: 'hero',
            location: 'hero_secondary',
            ctaLabel: ctaSecondaryLabel,
            ctaHref: secondaryHref,
            variant: 'secondary',
            industry: industryKey,
          })
        }
        />
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={460}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Common Challenges"
            title="Where compliance operations typically break down"
            subtitle="Challenges vary by environment, but the failure modes are consistent: ownership gaps, weak evidence chains, and manual reconstruction."
            variant="rule"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((item, idx) => (
              <ScrollReveal
                key={item.title}
                variant={idx % 2 === 0 ? 'splitLeft' : 'splitRight'}
                range={[0, 0.3 + idx * 0.05]}
              >
                <HoverLift>
                  <GlassCard intensity="normal" className="h-full p-6">
                    <item.icon className="mb-4 h-6 w-6 text-slate-300" />
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={520}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Interactive Demo"
            title={demoTitle}
            subtitle={demoDescription}
          />
          <div className="grid gap-5 lg:grid-cols-2">{demoSlot}</div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={420}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Operational Workflows"
            title="Execution model"
            subtitle="Run compliance through explicit workflows so tasks, approvals, and evidence remain connected."
            variant="rule"
          />
          <div className="space-y-4">
            {workflows.map((workflow, idx) => (
              <ScrollReveal
                key={workflow.title}
                variant="slideUp"
                range={[0, 0.3 + idx * 0.05]}
              >
                <GlassCard intensity="normal" className="p-6">
                  <h3 className="text-lg font-semibold text-white">
                    {workflow.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-300">
                    {workflow.description}
                  </p>
                  {workflow.steps && workflow.steps.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      {workflow.steps.map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={560}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Mapped Standards"
            title="Framework and control coverage"
            subtitle="Maintain audit-ready evidence against the standards your teams are accountable for."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {standards.map((standard, idx) => (
              <ScrollReveal
                key={standard.name}
                variant={idx % 2 === 0 ? 'splitLeft' : 'splitRight'}
                range={[0, 0.3 + idx * 0.05]}
              >
                <GlassCard className="h-full p-6" intensity="subtle">
                  <h3 className="text-lg font-semibold text-white">
                    {standard.name}
                  </h3>
                  {standard.description && (
                    <p className="mt-2 text-sm text-slate-300">
                      {standard.description}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {standard.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={380}>
        <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Measured Impact"
            title="Expected operational outcomes"
            subtitle="Representative outcomes from teams moving compliance from periodic projects to daily operations."
            variant="rule"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <ScrollReveal
                key={metric.label}
                variant="scaleUp"
                range={[0, 0.3 + idx * 0.04]}
              >
                <GlassCard
                  className="h-full p-6 text-center !bg-slate-950/60"
                  intensity="strong"
                >
                  <div className="text-3xl font-bold text-white">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <p className="mt-3 text-xs text-slate-300">
                      {metric.description}
                    </p>
                  )}
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={260}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <UseCaseSectionHeader
            label="Continue Evaluation"
            title="Related trust and buying paths"
            subtitle="Use adjacent comparison, trust, and pricing pages to move from industry fit into security review and procurement."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {relatedLinks.map((link, idx) => (
              <ScrollReveal
                key={link.href}
                variant="slideUp"
                range={[0, 0.3 + idx * 0.04]}
              >
                <GlassCard className="h-full p-6" intensity="subtle">
                  <Link
                    href={link.href}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'use_case',
                        section: 'related_paths',
                        location: link.href,
                        ctaLabel: link.label,
                        ctaHref: link.href,
                        variant: 'resource',
                        industry: industryKey,
                      })
                    }
                    className="block"
                  >
                    <div className="text-lg font-semibold text-white">
                      {link.label}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {link.description}
                    </p>
                  </Link>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <GlassCard intensity="intense" className="p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            {ctaDescription}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              onClick={() =>
                trackCtaClick({
                  surface: 'use_case',
                  section: 'final_cta',
                  location: 'final_primary',
                  ctaLabel: ctaPrimaryLabel,
                  ctaHref: primaryHref,
                  variant: 'final',
                  industry: industryKey,
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold shadow-lg transition hover:opacity-90"
            >
              {ctaPrimaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondaryHref}
              onClick={() =>
                trackCtaClick({
                  surface: 'use_case',
                  section: 'final_cta',
                  location: 'final_secondary',
                  ctaLabel: ctaSecondaryLabel,
                  ctaHref: secondaryHref,
                  variant: 'final',
                  industry: industryKey,
                })
              }
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
