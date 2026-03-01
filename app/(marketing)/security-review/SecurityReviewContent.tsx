'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileLock2,
  Fingerprint,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SecurityReviewHeroVisual } from './components/SecurityReviewHeroVisual';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { motion } from 'framer-motion';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const sections = [
  {
    icon: ShieldCheck,
    title: 'Security architecture overview',
    points: [
      'Multi-tenant architecture with Row-Level Security (RLS) — strict org boundary enforcement at the database layer',
      'Application-layer authorization with RBAC model and segregation of duties across all compliance workflows',
      'Change management controls: code review, CI/CD pipeline gates, staging environments, and rollback procedures',
      'Infrastructure hosted on enterprise-grade cloud providers with automatic failover and disaster recovery',
      'Network segmentation and firewall rules enforcing least-privilege access between services',
      'Dependency scanning and vulnerability management integrated into the development lifecycle',
    ],
  },
  {
    icon: Fingerprint,
    title: 'Identity, auth, and SSO',
    points: [
      'Google OAuth on all plans; SAML 2.0 SSO for Okta, Azure AD, Google Workspace on Enterprise plan',
      'MFA policy enforcement with configurable session duration and idle timeout controls',
      'SCIM provisioning for automated user lifecycle management — onboarding, role changes, and offboarding',
      'Role-based access control with granular permissions: admin, compliance lead, reviewer, auditor, read-only',
      'Session management with forced re-authentication for sensitive operations (evidence approval, user management)',
      'SSO enforcement mode: block password login when SSO is configured to prevent shadow authentication',
    ],
  },
  {
    icon: Lock,
    title: 'Data handling and encryption',
    points: [
      'AES-256 encryption at rest; TLS 1.3 in transit — no exceptions across all data types and environments',
      'Evidence chain-of-custody metadata: uploader identity, verifier, timestamps, and control linkage preserved',
      'Retention policies aligned to your regulatory requirements with configurable retention periods per data type',
      'Full data portability on exit: structured export of all data, evidence, and audit history within 30 days',
      'Backup encryption with separate key management — backups are encrypted independently of primary storage',
      'No data sharing with third parties beyond documented subprocessors; subprocessor list publicly available',
    ],
  },
  {
    icon: FileLock2,
    title: 'Audit logging and evidence defensibility',
    points: [
      'Tamper-evident, immutable audit logs for every compliance action — timestamped, uneditable, and append-only',
      'Evidence verification workflow with approval, rejection, and segregation controls fully documented',
      'Framework-mapped audit bundles exportable in under 2 minutes for regulator, auditor, or board review',
      'User activity logs: login history, permission changes, evidence access, and administrative actions recorded',
      'Evidence versioning: superseded artifacts are retained with full version history and reason-for-change',
      'Audit log retention: minimum 7 years with configurable extension for long-tail regulatory obligations',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Operational assurance and residency',
    points: [
      'AU-based hosting by default; US and EU data residency options for international regulatory obligations',
      'Annual independent penetration test by qualified assessors — summary report available under NDA for Enterprise',
      'DPA (Data Processing Agreement) covering GDPR and Privacy Act 1988 obligations, available pre-signature',
      'Vendor assurance questionnaire (CAIQ-aligned) pre-completed and available for procurement review',
      'SLA documentation with uptime commitments, incident response targets, and escalation procedures',
      '99.9% uptime SLA on Enterprise plan with credit-backed guarantees and monthly availability reporting',
    ],
  },
] as const;

const checklist = [
  'Data flow diagram (high level) + tenant isolation model (RLS posture)',
  'Authentication methods — Google OAuth, SAML 2.0 SSO, MFA enforcement',
  'AES-256 at rest + TLS 1.3 in transit encryption confirmation',
  'Evidence storage approach, access controls, and chain-of-custody metadata',
  'Audit logging coverage, tamper-evident history, and export capabilities',
  'Data residency options (AU/US/EU) and DPA documentation',
  'Annual penetration test summary (available under NDA)',
  'Incident response posture and operational escalation contacts',
  'Data portability confirmation — portable export, 30-day deletion on exit',
  'Subprocessor list with data categories, locations, and processing purposes',
  'Business continuity and disaster recovery posture (RPO/RTO targets)',
  'Vendor risk management — third-party dependency governance and review cadence',
] as const;

export default function SecurityReviewContent() {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="security-review"
        visualContent={<SecurityReviewHeroVisual />}
        badge={{ icon: <ShieldCheck className="h-4 w-4" />, text: 'Procurement Ready' }}
        headline="Security Review Packet for Enterprise Buyers"
        subheadline="Everything your security team, legal team, and procurement team will ask — documented before they ask it. Architecture, AES-256 encryption, SAML 2.0 SSO, penetration testing, data residency, and DPA."
        primaryCta={{ href: '/contact', label: 'Security Walkthrough' }}
        secondaryCta={{ href: `${appBase}/auth/signup?source=security_review`, label: 'Start Trust-Ready Trial' }}
      />

      <VisualDivider />

      {/* Section Cards */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => (
              <ScrollReveal
                key={s.title}
                variant="scaleUp"
                range={[0, 0.3 + i * 0.05]}
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <s.icon className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Security Review Checklist */}
      <DeferredSection minHeight={320}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Security Review Checklist
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                    The items below match typical procurement questionnaires. If
                    your organization needs additional detail (DPA, vendor risk
                    artifacts, or proof-of-control screenshots), we can support that
                    during the walkthrough.
                  </p>
                </div>
                <Link
                  href="/trust"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Visit Trust Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/security-review/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Security Review FAQ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {checklist.map((item, i) => (
                  <ScrollReveal
                    key={item}
                    variant="fadeUp"
                    range={[0, 0.3 + i * 0.04]}
                  >
                    <div
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <p className="mt-6 text-xs text-slate-500">
                Note: Content here describes the FormaOS review experience. Do not
                treat it as a formal certification claim.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
