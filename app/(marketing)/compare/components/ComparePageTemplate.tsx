'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Check, Minus, AlertCircle } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';
import { DeferredSection } from '../../components/shared';
import { motion } from 'framer-motion';
import { CompareHeroVisual } from './CompareHeroVisual';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export interface ComparePoint {
  title: string;
  detail: string;
}

export interface CompareFeatureRow {
  feature: string;
  formaos: string;
  competitor: string;
}

export interface ComparePageTemplateProps {
  competitor: string;
  heroDescription: string;
  points: readonly ComparePoint[];
  idealIf: readonly string[];
  procurementChecks: readonly ComparePoint[];
  featureComparison: readonly CompareFeatureRow[];
  competitorStrengths: readonly string[];
  source: string;
}

function FeatureCell({ value }: { value: string }) {
  if (value === 'yes') return <Check className="h-4 w-4 text-emerald-400 mx-auto" />;
  if (value === 'no') return <Minus className="h-4 w-4 text-slate-600 mx-auto" />;
  if (value === 'partial') return <AlertCircle className="h-4 w-4 text-amber-400 mx-auto" />;
  return <span className="text-xs text-slate-300 leading-snug">{value}</span>;
}

export function ComparePageTemplate({
  competitor,
  heroDescription,
  points,
  idealIf,
  procurementChecks,
  featureComparison,
  competitorStrengths,
  source,
}: ComparePageTemplateProps) {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="compare"
        visualContent={<CompareHeroVisual competitor={competitor} />}
        badge={{
          icon: <Sparkles className="w-4 h-4" />,
          text: 'Comparison',
        }}
        headline={<>FormaOS vs {competitor}</>}
        subheadline={heroDescription}
        extras={
          <Link
            href="/compare"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Back to Compare
          </Link>
        }
        primaryCta={{ href: '/contact', label: 'Book Buyer Demo' }}
        secondaryCta={{
          href: `${appBase}/auth/signup?source=${source}`,
          label: 'Start Free Trial',
        }}
      />

      <VisualDivider />

      {/* Feature Comparison Table */}
      <DeferredSection minHeight={400}>
        <section className="mk-section relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="slideUp" range={[0, 0.3]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white">Feature Comparison</h2>
                <p className="mt-1 text-sm text-slate-400">Side-by-side evaluation across key compliance capabilities</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[45%]">Capability</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-teal-400 w-[27.5%]">FormaOS</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[27.5%]">{competitor}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, i) => (
                      <tr key={row.feature} className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="py-3 px-6 text-sm text-slate-300">{row.feature}</td>
                        <td className="py-3 px-4 text-center"><FeatureCell value={row.formaos} /></td>
                        <td className="py-3 px-4 text-center"><FeatureCell value={row.competitor} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-white/[0.06] flex items-center gap-6 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400" /> Included</span>
                <span className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3 text-amber-400" /> Partial / Limited</span>
                <span className="flex items-center gap-1.5"><Minus className="h-3 w-3 text-slate-600" /> Not available</span>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Differentiator Points */}
      <DeferredSection minHeight={320}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionChoreography pattern="alternating" className="grid gap-4 lg:grid-cols-3">
            {points.map((p) => (
                <motion.article
                  key={p.title}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {p.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {p.detail}
                  </p>
                </motion.article>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* When competitor is the right choice */}
      <DeferredSection minHeight={180}>
        <section className="mk-section relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="slideUp" range={[0, 0.3]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7">
              <h2 className="text-lg font-semibold text-white mb-1">
                When {competitor} may be the right choice
              </h2>
              <p className="text-xs text-slate-500 mb-4">We believe honest comparison builds trust. {competitor} is a strong platform for specific use cases.</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {competitorStrengths.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Procurement Evaluation */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7">
              <h2 className="text-lg font-semibold text-white">
                Procurement Evaluation Focus
              </h2>
              <SectionChoreography pattern="alternating" className="mt-4 grid gap-3 md:grid-cols-3">
                {procurementChecks.map((check) => (
                    <article key={check.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                        {check.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {check.detail}
                      </p>
                    </article>
                ))}
              </SectionChoreography>
            </div>
          </Reveal>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Ideal If + CTAs */}
      <DeferredSection minHeight={320}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                FormaOS is ideal if
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {idealIf.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/security-review"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Security Review Packet
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/frameworks"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Framework Coverage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                This page is an evaluation aid, not a claim of feature parity.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
