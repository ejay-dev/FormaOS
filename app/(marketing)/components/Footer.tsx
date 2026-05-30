'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { CURRENT_RELEASE_DISPLAY, CURRENT_RELEASE_TAG } from '@/config/release';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { footerLinks } from '@/config/navigation';
import { brand } from '@/config/brand';
import { compliancePlanHref, PUBLIC_CTA_LABELS, salesHref } from '@/lib/marketing/cta';
import {
  Mail,
  MapPin,
  Shield,
  Lock,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

const compliancePlanUrl = compliancePlanHref('footer');
const salesUrl = salesHref('footer');

/* ── Footer CTA ──────────────────────────────────────────── */

function FooterCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(113,113,122,0.08) 0%, rgba(148,163,184,0.06) 50%, rgba(113,113,122,0.04) 100%)',
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(113,113,122,0.08)' }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(148,163,184,0.06)' }}
      />

      <div className="relative z-10 p-8 sm:p-10 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 mb-2">
              Ready to evaluate?
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
              See how FormaOS works for your team
            </h3>
            <p className="mt-3 text-slate-400 max-w-lg text-sm leading-relaxed">
              Get a guided compliance plan scoped to your frameworks,
              evidence burden, and audit exposure.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href={compliancePlanUrl}
              onClick={() =>
                trackCtaClick({
                  surface: 'footer',
                  section: 'footer_cta',
                  location: 'footer_primary',
                  ctaLabel: PUBLIC_CTA_LABELS.compliancePlan,
                  ctaHref: compliancePlanUrl,
                  variant: 'primary',
                })
              }
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-7 py-3.5 min-h-[48px] w-full sm:w-auto text-sm font-semibold transition-all hover:opacity-90"
            >
              {PUBLIC_CTA_LABELS.compliancePlan}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={salesUrl}
              onClick={() =>
                trackCtaClick({
                  surface: 'footer',
                  section: 'footer_cta',
                  location: 'footer_secondary',
                  ctaLabel: PUBLIC_CTA_LABELS.talkToSales,
                  ctaHref: salesUrl,
                  variant: 'secondary',
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 min-h-[48px] w-full sm:w-auto text-sm font-semibold text-white transition-all hover:bg-white/[0.08] hover:border-white/20"
            >
              {PUBLIC_CTA_LABELS.talkToSales}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Footer link column ─────────────────────────────────── */

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] text-slate-500 hover:text-white transition-colors duration-200 leading-relaxed block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Trust badges ────────────────────────────────────────── */

const trustBadges = [
  { icon: Shield, label: 'Security-first architecture' },
  { icon: Lock, label: 'Encryption at rest & in transit' },
  { icon: FileCheck, label: 'Audit-ready evidence chain' },
] as const;

/* ── Footer ──────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="mk-footer-premium relative overflow-hidden border-t border-white/[0.06]">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0a0f1c 0%, #080c18 50%, #060a14 100%)',
        }}
      />

      {/* Subtle top edge glow */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(113,113,122,0.1) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="py-10 sm:py-12 lg:py-14">
          <FooterCTA />
        </div>

        {/* Main Footer Content */}
        <div className="border-t border-white/[0.06] py-12 sm:py-14">
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
            {/* Brand column — wider */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 mb-2 lg:mb-0">
              <Link
                href="/"
                aria-label="FormaOS home"
                className="inline-flex items-center text-white transition-opacity hover:opacity-90"
              >
                <Logo variant="wordmark" size={22} />
              </Link>
              <p className="mt-4 text-[13px] text-slate-500 leading-relaxed max-w-[260px]">
                The compliance operating system for regulated Australian
                industries.
              </p>

              {/* Trust badges */}
              <div className="mt-6 space-y-3">
                {trustBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2.5"
                  >
                    <div className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06]">
                      <badge.icon
                        className="h-2.5 w-2.5 text-slate-500"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <FooterLinkColumn title="Platform" links={footerLinks.platform} />
            <FooterLinkColumn title="Solutions" links={footerLinks.solutions} />
            <FooterLinkColumn title="Resources" links={footerLinks.resources} />
            <FooterLinkColumn title="Company" links={footerLinks.company} />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] py-6 sm:py-7">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Left: copyright + version */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-slate-600">
              <span>&copy; {new Date().getFullYear()} FormaOS Pty Ltd</span>
              <span className="text-slate-800">·</span>
              <span className="text-slate-700">
                {CURRENT_RELEASE_DISPLAY}
              </span>
              <span className="text-slate-600/60 font-mono text-[11px]">
                {CURRENT_RELEASE_TAG}
              </span>
            </div>

            {/* Right: contact + status */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link
                href={`mailto:${brand.email.contactEmail}`}
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-white transition-colors"
              >
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                {brand.email.contactEmail}
              </Link>
              <div className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {brand.address.locality}, {brand.address.region}, {brand.address.country}
              </div>
              {/* /status badge removed 2026-05-13 — was hardcoded
                  "All systems operational" against 0% uptime data.
                  Route will return when a real status provider is
                  wired. */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
