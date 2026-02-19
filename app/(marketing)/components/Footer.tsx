'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import { easing, duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { CURRENT_RELEASE_DISPLAY, CURRENT_RELEASE_TAG } from '@/config/release';
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Shield,
  Lock,
  FileCheck,
} from 'lucide-react';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const footerLinks = {
  platform: [
    { href: '/product', label: 'How it works' },
    { href: '/industries', label: 'Industries' },
    { href: '/security', label: 'Security' },
    { href: '/frameworks', label: 'Framework Coverage' },
    { href: '/pricing', label: 'Pricing' },
  ],
  useCases: [
    { href: '/use-cases/healthcare', label: 'Healthcare' },
    { href: '/use-cases/ndis-aged-care', label: 'NDIS & Aged Care' },
    { href: '/use-cases/workforce-credentials', label: 'Workforce' },
    { href: '/use-cases/incident-management', label: 'Incidents' },
  ],
  resources: [
    { href: '/docs', label: 'Documentation' },
    { href: '/blog', label: 'Blog' },
    { href: '/trust', label: 'Trust Center' },
    { href: '/security-review', label: 'Security Review Packet' },
    { href: '/trust/packet', label: 'Trust Packet (PDF)' },
    { href: '/status', label: 'Status' },
    { href: '/customer-stories', label: 'Customer Stories' },
    { href: '/compare', label: 'Compare' },
    { href: '/faq', label: 'FAQ' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/our-story', label: 'Our Story' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/legal', label: 'Legal' },
    {
      href: 'https://www.formaos.com.au/legal/privacy',
      label: 'Privacy Policy',
    },
    { href: '/legal/terms', label: 'Terms of Service' },
    { href: '/security', label: 'Security' },
    { href: '/trust', label: 'Assurance Portal' },
  ],
};

const trustBadges = [
  { icon: Shield, label: 'Security-first controls', color: 'primary' },
  { icon: Lock, label: 'Encrypted data flows', color: 'secondary' },
  { icon: FileCheck, label: 'Audit-ready logs', color: 'accent' },
];

function AnimatedFooterLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: duration.fast, ease: easing.signature }}
    >
      <Link
        href={href}
        className="group flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span>{label}</span>
        {external && (
          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    </motion.div>
  );
}

function FooterCTA() {
  return (
    <ScrollReveal variant="fadeUp" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border border-white/10 p-8 lg:p-10">
      {/* Animated gradient orb */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-bold mb-3 font-display">
          Ready to transform your compliance?
        </h3>
        <p className="text-gray-400 mb-6 max-w-md">
          Start your 14-day free trial. No credit card required. Full platform
          access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: duration.fast, ease: easing.signature }}
          >
            <Link
              href={`${appBase}/auth/signup`}
              className="mk-btn mk-btn-primary rounded-xl px-6 py-3"
            >
              Start Free Trial
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: duration.fast, ease: easing.signature }}
          >
            <Link
              href="/contact"
              className="mk-btn mk-btn-secondary rounded-xl px-6 py-3"
            >
              Request Demo
            </Link>
          </motion.div>
        </div>
      </div>
    </ScrollReveal>
  );
}

function TrustBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Shield;
  label: string;
  color: string;
}) {
  const colorClasses =
    {
      primary:
        'bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(0,212,251,0.3)]',
      secondary:
        'bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(77,159,255,0.3)]',
      accent:
        'bg-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(167,139,250,0.3)]',
    }[color] || 'bg-cyan-500/20 text-cyan-400';

  return (
    <ScrollReveal variant="fadeUp" className="flex items-center gap-2 text-sm">
      <div className={`p-1.5 rounded-lg ${colorClasses}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-gray-400">{label}</span>
    </ScrollReveal>
  );
}

export function Footer() {
  return (
    <footer className="mk-footer-premium mk-page-bg-alt relative overflow-hidden border-t border-white/10">
      <AmbientParticleLayer intensity="subtle" />
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0a0f1c]/95 to-[#0a0f1c]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-cyan-500/5 blur-[100px]"
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-[15%] w-80 h-80 rounded-full bg-blue-500/5 blur-[120px]"
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="py-16 lg:py-20">
          <FooterCTA />
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 py-12 border-t border-white/10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <ScrollReveal variant="blurIn">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Logo variant="mark" size={40} />
              </Link>
            </ScrollReveal>

            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The compliance operating system for regulated industries. Govern,
              execute, and prove audit readiness.
            </p>

            {/* Status indicator */}
            <ScrollReveal variant="blurIn" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <motion.span
                className="h-2 w-2 rounded-full bg-green-500"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0.4)',
                    '0 0 0 8px rgba(34, 197, 94, 0)',
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-green-400">
                All systems operational
              </span>
            </ScrollReveal>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Platform
            </h4>
            <div className="space-y-3">
              {footerLinks.platform.map((link) => (
                <AnimatedFooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Use Cases Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Use Cases
            </h4>
            <div className="space-y-3">
              {footerLinks.useCases.map((link) => (
                <AnimatedFooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Resources
            </h4>
            <div className="space-y-3">
              {footerLinks.resources.map((link) => (
                <AnimatedFooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Company
            </h4>
            <div className="space-y-3">
              {footerLinks.company.map((link) => (
                <AnimatedFooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-600 font-semibold">
              Legal
            </h4>
            <div className="space-y-3">
              {footerLinks.legal.map((link) => (
                <AnimatedFooterLink key={link.href} {...link} />
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {trustBadges.map((badge) => (
              <TrustBadge key={badge.label} {...badge} />
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <ScrollReveal variant="fadeUp" className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FormaOS. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">{CURRENT_RELEASE_DISPLAY}</span>
            <span className="text-gray-700">|</span>
            <span className="text-cyan-500/70">{CURRENT_RELEASE_TAG}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="mailto:hello@formaos.com.au"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>hello@formaos.com.au</span>
            </Link>
            <span className="text-gray-700">|</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>Sydney, Australia</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
