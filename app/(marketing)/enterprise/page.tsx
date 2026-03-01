import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Globe,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  Building2,
  Clock,
  Server,
  BadgeCheck,
  CalendarDays,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS for Enterprise | Compliance Operating System',
  description:
    'Enterprise compliance management with SAML 2.0 SSO, data residency controls, 99.9% SLA, audit-ready artifacts, and dedicated security review support. Built for regulated industries.',
  alternates: { canonical: `${siteUrl}/enterprise` },
  openGraph: {
    title: 'FormaOS for Enterprise | Compliance Operating System',
    description:
      'Enterprise compliance management with SAML 2.0 SSO, data residency controls, 99.9% SLA, and audit-ready procurement artifacts.',
    type: 'website',
    url: `${siteUrl}/enterprise`,
  },
};

const enterpriseFeatures = [
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & SCIM Provisioning',
    description:
      'Metadata-based SAML 2.0 configuration with Okta, Microsoft Entra ID (Azure AD), and Google Workspace. SCIM 2.0 user provisioning syncs your identity provider with FormaOS automatically.',
  },
  {
    icon: Globe,
    title: 'Data Residency Controls',
    description:
      'AU-based hosting by default. Enterprise customers select residency at onboarding — Australia, United States, or European Union. Standard Contractual Clauses for international transfers.',
  },
  {
    icon: Users,
    title: 'Multi-Entity Management',
    description:
      'Manage compliance across multiple entities, sites, or business units with entity-scoped controls, evidence, and audit trails. Centralized executive dashboard with cross-entity rollup.',
  },
  {
    icon: ShieldCheck,
    title: 'MFA Enforcement',
    description:
      'Enforce MFA across your entire tenant from the identity governance settings. Supports TOTP, hardware keys, and provider-managed MFA via SAML SSO session validation.',
  },
  {
    icon: Server,
    title: '99.9% Monthly Uptime SLA',
    description:
      'SLA target incorporated into your executed MSA/SOW. P1 critical incident acknowledgement within 1 business hour; P2 within 4 business hours. 48-hour advance notice for planned maintenance.',
  },
  {
    icon: FileText,
    title: 'Procurement Artifacts on Day One',
    description:
      'DPA, vendor assurance questionnaire, security review packet, subprocessor disclosures, and penetration test executive summary — available before procurement asks the first question.',
  },
];

const procurementChecklist = [
  { label: 'Data Processing Agreement (DPA)', href: '/trust/dpa' },
  { label: 'Vendor Assurance Questionnaire', href: '/trust/vendor-assurance' },
  { label: 'Subprocessor List + Data Flow Diagram', href: '/trust/subprocessors' },
  { label: 'Penetration Test Executive Summary (NDA)', href: '/contact' },
  { label: 'Trust Packet PDF (architecture, encryption, identity)', href: '/trust/packet' },
  { label: 'Security Review Packet', href: '/security-review' },
  { label: 'SLA Terms (99.9% uptime, P1/P2 response)', href: '/trust/sla' },
  { label: 'Data Residency Confirmation', href: '/trust/data-handling' },
];

const slaCommitments = [
  { label: 'Monthly uptime SLA', value: '99.9%' },
  { label: 'P1 critical — acknowledgement', value: '< 1 hr' },
  { label: 'P2 high priority — acknowledgement', value: '< 4 hrs' },
  { label: 'Planned maintenance notice', value: '48 hrs min' },
  { label: 'Annual uptime report', value: 'On request' },
  { label: 'Named escalation path', value: 'Included' },
];

const testimonials = [
  {
    quote:
      'Our procurement team had a complete vendor risk package within 24 hours of requesting it. DPA countersigned, penetration test summary reviewed, SLA confirmed. No delays to the project timeline.',
    name: 'Darren F.',
    role: 'Head of IT Procurement',
    org: 'National Healthcare Network',
    sector: 'Healthcare',
  },
  {
    quote:
      'We manage compliance for 14 registered NDIS sites. FormaOS gives each site its own audit trail while our compliance team has a single view across all of them. The multi-entity model is exactly what enterprise buyers need.',
    name: 'Alicia W.',
    role: 'Group Compliance Director',
    org: 'Multi-Site Disability Services Organisation',
    sector: 'NDIS',
  },
];

export default function EnterprisePage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="FormaOS for Enterprise"
        description="Enterprise-grade compliance governance — SAML 2.0 SSO, data residency controls, 99.9% SLA, multi-entity management, and a full procurement artifact suite. Built for regulated industries where accountability is non-negotiable."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={
          <CompactHeroIcon
            icon={<Building2 className="w-8 h-8 text-emerald-400" />}
            color="52,211,153"
          />
        }
      />

      <div className="mx-auto max-w-5xl px-6 pb-24">

        {/* Enterprise features grid */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Enterprise-Grade Capabilities
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enterpriseFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SLA commitments */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-7">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">SLA Commitments — Enterprise</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slaCommitments.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground ml-3 shrink-0">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            SLA terms are incorporated into your executed MSA/SOW. Contact us to initiate the
            enterprise agreement process.
          </p>
        </section>

        {/* Procurement checklist */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">
              Procurement Artifact Checklist
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Every artifact your legal, security, and risk teams need is available before they ask.
            Enterprise customers receive countersigned copies of the DPA and NDA-gated artifacts
            within 2 business days of request.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {procurementChecklist.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-primary/30 hover:bg-muted/20 transition-colors"
              >
                <CheckCircle className="h-4 w-4 text-primary/70 shrink-0" aria-hidden="true" />
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-5">
            Enterprise Teams on FormaOS
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} · {t.org}</div>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                    {t.sector}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* CTA block */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">
              Start Your Enterprise Evaluation
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Request a security review walkthrough, download the Trust Packet, or initiate
            procurement. Most enterprise security reviews complete within 5–7 business days.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Schedule Security Walkthrough
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust/packet"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
            >
              Download Trust Packet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${appBase}/auth/signup?source=enterprise`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
            >
              Start Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-6 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Trust Center
          </Link>
          <Link href="/security-review" className="text-primary hover:underline">
            Security Review Packet →
          </Link>
          <Link href="/pricing" className="text-primary hover:underline">
            Enterprise Pricing →
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
