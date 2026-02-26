'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionHeader, VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { GlassCard, HoverLift } from '@/components/motion/EnhancedMotion';
import { DeferredSection, MarketingPageShell } from '.';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export interface ComparisonRow {
  feature: string;
  formaos: string;
  traditional: string;
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

interface SeoLandingTemplateProps {
  badge: string;
  badgeIcon: ReactNode;
  headline: ReactNode;
  subheadline: string;
  /** Long-form intro paragraphs displayed after hero */
  introParagraphs: string[];
  /** Problem-focused content sections */
  problemSections: ContentSection[];
  /** Solution-focused content sections */
  solutionSections: ContentSection[];
  /** Comparison table */
  comparison: {
    title: string;
    subtitle?: string;
    traditionalLabel: string;
    rows: ComparisonRow[];
  };
  /** Structured FAQ answers */
  faq: FaqItem[];
  /** Internal link cards */
  relatedLinks: { label: string; href: string; description: string }[];
  /** CTA */
  ctaTitle: string;
  ctaDescription: string;
}

export function SeoLandingTemplate({
  badge,
  badgeIcon,
  headline,
  subheadline,
  introParagraphs,
  problemSections,
  solutionSections,
  comparison,
  faq,
  relatedLinks,
  ctaTitle,
  ctaDescription,
}: SeoLandingTemplateProps) {
  return (
    <MarketingPageShell>
      <ImmersiveHero
        theme="product"
        badge={{ icon: badgeIcon, text: badge }}
        headline={headline}
        subheadline={subheadline}
        primaryCta={{ href: `${appBase}/auth/signup`, label: 'Start Free Trial' }}
        secondaryCta={{ href: '/product', label: 'Explore Platform' }}
      />

      <VisualDivider />

      {/* Long-form intro */}
      <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-6 text-base leading-relaxed text-slate-300">
          {introParagraphs.map((p, i) => (
            <ScrollReveal key={i} variant="fadeUp" range={[0, 0.3 + i * 0.05]}>
              <p>{p}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <VisualDivider gradient={false} />

      {/* Problem sections */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {problemSections.map((section, idx) => (
            <ScrollReveal key={section.heading} variant="fadeUp" range={[0, 0.3 + idx * 0.05]}>
              <div className="mb-12 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-300">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollReveal>
          ))}
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Solution sections */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="How FormaOS Helps"
            title="From obligation to operational control"
            subtitle="FormaOS transforms compliance requirements into executable workflows with built-in evidence capture."
          />
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            {solutionSections.map((section, idx) => (
              <ScrollReveal
                key={section.heading}
                variant={idx % 2 === 0 ? 'splitLeft' : 'splitRight'}
                range={[0, 0.3 + idx * 0.04]}
              >
                <HoverLift>
                  <GlassCard intensity="normal" className="h-full p-6">
                    <h3 className="text-lg font-semibold text-white">{section.heading}</h3>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-300">
                      {section.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        {section.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                </HoverLift>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Comparison table */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Comparison"
            title={comparison.title}
            subtitle={comparison.subtitle}
          />
          <div className="mt-8 overflow-x-auto">
            <GlassCard intensity="normal" className="p-0 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-slate-400 font-medium">Feature</th>
                    <th className="px-6 py-4 text-cyan-300 font-semibold">FormaOS</th>
                    <th className="px-6 py-4 text-slate-400 font-medium">{comparison.traditionalLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={idx < comparison.rows.length - 1 ? 'border-b border-white/5' : ''}
                    >
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

      <VisualDivider />

      {/* FAQ / Structured Answers */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader badge="FAQ" title="Common questions" />
          <div className="mt-8 space-y-6">
            {faq.map((item, idx) => (
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

      <VisualDivider gradient={false} />

      {/* Related internal links */}
      <DeferredSection minHeight={200}>
        <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader badge="Related" title="Explore more" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedLinks.map((link) => (
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

      {/* Final CTA */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <GlassCard intensity="intense" glow className="p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">{ctaDescription}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`${appBase}/auth/signup`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Schedule Demo
            </Link>
          </div>
        </GlassCard>
      </section>
    </MarketingPageShell>
  );
}

export default SeoLandingTemplate;
