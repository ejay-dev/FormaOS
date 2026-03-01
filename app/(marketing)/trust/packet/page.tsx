import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileDown,
  ArrowRight,
  Package,
  Lock,
  Globe,
  Server,
  ShieldCheck,
  FileText,
  Users,
  CheckCircle,
} from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Vendor Trust Packet',
  description:
    'Procurement-ready vendor trust packet covering architecture, encryption, identity governance, data residency, and assurance commitments. Download for enterprise security review.',
  alternates: { canonical: `${siteUrl}/trust/packet` },
  openGraph: {
    title: 'FormaOS | Vendor Trust Packet',
    description:
      'Procurement-ready vendor trust packet covering architecture, encryption, identity governance, data residency, and assurance commitments.',
    type: 'website',
    url: `${siteUrl}/trust/packet`,
  },
};

const sections = [
  {
    icon: ShieldCheck,
    title: 'Security Posture Overview',
    items: [
      'Application security architecture and threat model summary',
      'OWASP Top 10 coverage and mitigation approach',
      'Annual penetration test cadence and findings classification',
      'Vulnerability disclosure and remediation tracking policy',
    ],
  },
  {
    icon: Lock,
    title: 'Encryption & Access Controls',
    items: [
      'AES-256 encryption at rest — all tenant data and evidence artifacts',
      'TLS 1.3 encryption in transit for all platform traffic',
      'Role-based access controls with principle of least privilege',
      'SAML 2.0 SSO configuration guide (Okta, Azure AD, Google Workspace)',
      'MFA enforcement options for Enterprise tenants',
    ],
  },
  {
    icon: Globe,
    title: 'Data Residency & Subprocessors',
    items: [
      'Default hosting: Australia (AU region)',
      'Enterprise residency options: AU / US / EU — configurable at onboarding',
      'Subprocessor list with hosting regions and data processing purposes',
      'Standard Contractual Clauses (SCCs) for international transfers',
      'Data flow diagram from collection to storage to deletion',
    ],
  },
  {
    icon: Server,
    title: 'Infrastructure & Availability',
    items: [
      'Hosting provider SOC 2 reports available on request',
      'Automated backup and point-in-time recovery',
      'Enterprise uptime target: 99.9% monthly — incorporated in MSA/SOW',
      'Incident response process and breach notification timelines',
      'Planned maintenance window notification policy (48 hours minimum)',
    ],
  },
  {
    icon: FileText,
    title: 'Compliance & Legal Artifacts',
    items: [
      'Data Processing Agreement (DPA) — countersigned copy available for Enterprise',
      'Vendor assurance questionnaire pre-filled responses',
      'Privacy Act 1988 (Australian Privacy Principles) alignment summary',
      'GDPR data subject rights support overview',
      'Penetration test executive summary (NDA required)',
    ],
  },
  {
    icon: Users,
    title: 'Assurance Clarifications',
    items: [
      'Aligned vs certified: honest positioning of our current assurance posture',
      'What "aligned to SOC 2" means and what it does not claim',
      'Third-party assessment approach and artifact sharing under NDA',
      'How to escalate procurement questions to the FormaOS security team',
    ],
  },
];

export default function TrustPacketPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Vendor Trust Packet"
        description="A procurement-ready PDF generated from current system status. Covers architecture, encryption, identity governance, data residency, subprocessors, and assurance commitments — ready for your legal, risk, and security teams."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={<CompactHeroIcon icon={<Package className="w-8 h-8 text-emerald-400" />} color="52,211,153" />}
      />

      <div className="mx-auto max-w-4xl px-6 pb-24">
        {/* Download CTA */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                FormaOS Vendor Trust Packet (PDF)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Current version · Updated February 2026 · 6 sections · ~12 pages
              </p>
            </div>
            <a
              href="/api/trust-packet/vendor"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 shrink-0"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </div>

        {/* What's covered */}
        <h2 className="mt-12 mb-6 text-xl font-semibold text-foreground">
          What the packet covers
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-primary/60 shrink-0 mt-0.5" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Who it's for */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Who this is designed for</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Trust Packet is designed to answer the first wave of questions from your security team, legal counsel, and procurement reviewers — before a formal vendor questionnaire arrives. It uses intentional "aligned vs certified" language so your team knows exactly what we are claiming and what we are not. For NDA-gated artifacts (penetration test executive summary), use the request form below.
          </p>
        </div>

        {/* Secondary CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
          >
            Request NDA artifacts
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
          >
            Full Security Review Packet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-between text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link href="/trust/vendor-assurance" className="text-primary hover:underline">
            Vendor Assurance Process <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
