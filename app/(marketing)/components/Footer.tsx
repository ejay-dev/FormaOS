'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { CURRENT_RELEASE_DISPLAY, CURRENT_RELEASE_TAG } from '@/config/release';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { getSignUpUrl } from '@/lib/urls';
import { footerLinks } from '@/config/navigation';
import {
  Mail,
  MapPin,
  Shield,
  Lock,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

const signUpUrl = getSignUpUrl();

/* ── Footer CTA ──────────────────────────────────────────── */

function FooterCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent">
      {/* Gradient mesh atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(var(--mk-rgb-cyan), 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 60%, rgba(var(--mk-rgb-blue-alt), 0.06) 0%, transparent 60%)
          `,
        }}
      />
      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400/80 mb-2">
              Ready to evaluate?
            </p>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              See how FormaOS works for your team
            </h3>
            <p className="mt-2 text-slate-400 max-w-lg text-sm leading-relaxed">
              14-day trial with full platform access. No credit card, no
              commitment.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href={signUpUrl}
              onClick={() =>
                trackCtaClick({
                  surface: 'footer',
                  section: 'footer_cta',
                  location: 'footer_primary',
                  ctaLabel: 'Start Free Trial',
                  ctaHref: signUpUrl,
                  variant: 'primary',
                })
              }
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:brightness-110"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              onClick={() =>
                trackCtaClick({
                  surface: 'footer',
                  section: 'footer_cta',
                  location: 'footer_secondary',
                  ctaLabel: 'Talk to Sales',
                  ctaHref: '/contact',
                  variant: 'secondary',
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.08] hover:border-white/20"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Footer link ─────────────────────────────────────────── */

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mk-footer-link text-slate-500 hover:text-white transition-colors text-[13px] leading-relaxed"
    >
      {label}
    </Link>
  );
}

/* ── Trust badges ────────────────────────────────────────── */

const trustBadges = [
  { icon: Shield, label: 'Security-first architecture' },
  { icon: Lock, label: 'Encryption at rest and in transit' },
  { icon: FileCheck, label: 'Audit-ready evidence chain' },
] as const;

/* ── Footer ──────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="mk-footer-premium mk-page-bg-alt relative overflow-hidden border-t border-white/[0.06]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0a0f1c]/95 to-[#080c18]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="py-10 sm:py-12 lg:py-14">
          <FooterCTA />
        </div>

        {/* Main Footer Content - 5 columns on desktop */}
        <div className="border-t border-white/[0.06] py-10 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <Logo variant="mark" size={28} />
                <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  FormaOS
                </span>
              </Link>
              <p className="mt-3 text-[13px] text-slate-500 leading-relaxed max-w-[220px]">
                The compliance operating system for regulated Australian
                industries.
              </p>
              {/* Trust badges inline */}
              <div className="mt-5 space-y-2.5">
                {trustBadges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2">
                    <badge.icon
                      className="h-3 w-3 text-slate-600 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] text-slate-600">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-600 font-semibold">
                Platform
              </h4>
              <div className="space-y-2">
                {footerLinks.platform.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-600 font-semibold">
                Solutions
              </h4>
              <div className="space-y-2">
                {footerLinks.solutions.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-600 font-semibold">
                Resources
              </h4>
              <div className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-600 font-semibold">
                Company
              </h4>
              <div className="space-y-2">
                {footerLinks.company.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: copyright + version */}
            <div className="flex items-center gap-3 text-[12px] text-slate-600">
              <span>&copy; {new Date().getFullYear()} FormaOS Pty Ltd</span>
              <span className="text-slate-800">|</span>
              <span className="text-slate-700">{CURRENT_RELEASE_DISPLAY}</span>
              <span className="text-cyan-600/50 font-mono text-[11px]">
                {CURRENT_RELEASE_TAG}
              </span>
            </div>

            {/* Right: contact + status */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              <Link
                href="mailto:Formaos.team@gmail.com"
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-white transition-colors"
              >
                <Mail className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                Formaos.team@gmail.com
              </Link>
              <div className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                Sydney, Australia
              </div>
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
