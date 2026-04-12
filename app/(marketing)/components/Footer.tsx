'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { CURRENT_RELEASE_DISPLAY, CURRENT_RELEASE_TAG } from '@/config/release';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { getSignUpUrl } from '@/lib/urls';
import { footerLinks } from '@/config/navigation';
import { Mail, MapPin, Shield, Lock, FileCheck } from 'lucide-react';

const signUpUrl = getSignUpUrl();

/* ── Footer CTA ──────────────────────────────────────────── */

function FooterCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <ScrollReveal
      variant="fadeUp"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8 lg:p-10"
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-display">
            See how FormaOS works for your team
          </h3>
          <p className="mt-2 text-gray-400 max-w-lg text-sm sm:text-base">
            Evaluate the platform with a 14-day trial. No credit card required.
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
            className="mk-btn mk-btn-primary rounded-xl px-6 py-3"
          >
            Start Free Trial
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
            className="mk-btn mk-btn-secondary rounded-xl px-6 py-3"
          >
            Talk to Sales
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── Footer link ─────────────────────────────────────────── */

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mk-footer-link text-gray-500 hover:text-white transition-colors text-sm"
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
    <footer className="mk-footer-premium mk-page-bg-alt relative overflow-hidden border-t border-white/10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0a0f1c]/95 to-[#0a0f1c]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="py-10 sm:py-14 lg:py-20">
          <FooterCTA />
        </div>

        {/* Main Footer Content - 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 py-12 border-t border-white/10">
          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Platform
            </h4>
            <div className="space-y-3">
              {footerLinks.platform.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Solutions
            </h4>
            <div className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Resources
            </h4>
            <div className="space-y-3">
              {footerLinks.resources.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Company
            </h4>
            <div className="space-y-3">
              {footerLinks.company.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-sm"
              >
                <div className="p-1.5 rounded-lg bg-white/[0.06] text-slate-400">
                  <badge.icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-gray-500">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Logo variant="mark" size={32} />
            </Link>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} FormaOS. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">{CURRENT_RELEASE_DISPLAY}</span>
            <span className="text-gray-700">|</span>
            <span className="text-cyan-500/70">{CURRENT_RELEASE_TAG}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <Link
              href="mailto:Formaos.team@gmail.com"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm">Formaos.team@gmail.com</span>
            </Link>
            <span className="hidden sm:inline text-gray-700">|</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm">Sydney, Australia</span>
            </div>
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Operational
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
