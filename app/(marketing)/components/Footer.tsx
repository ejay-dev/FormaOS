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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.06) 50%, rgba(6,182,212,0.04) 100%)',
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(6,182,212,0.08)' }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.06)' }}
      />

      <div className="relative z-10 p-8 sm:p-10 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400/80 mb-2">
              Ready to evaluate?
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
              See how FormaOS works for your team
            </h3>
            <p className="mt-3 text-slate-400 max-w-lg text-sm leading-relaxed">
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
            'linear-gradient(90deg, transparent 10%, rgba(6,182,212,0.1) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="py-10 sm:py-12 lg:py-14">
          <FooterCTA />
        </div>

        {/* Main Footer Content */}
        <div className="border-t border-white/[0.06] py-12 sm:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
            {/* Brand column — wider */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 mb-2 lg:mb-0">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <Logo variant="mark" size={28} />
                <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  FormaOS
                </span>
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
              <span className="text-cyan-600/40 font-mono text-[11px]">
                {CURRENT_RELEASE_TAG}
              </span>
            </div>

            {/* Right: contact + status */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link
                href="mailto:Formaos.team@gmail.com"
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-white transition-colors"
              >
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                Formaos.team@gmail.com
              </Link>
              <div className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                Sydney, Australia
              </div>
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors"
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
