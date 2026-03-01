import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  Globe,
  Server,
  Lock,
} from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Data Processing Agreement',
  description:
    'FormaOS Data Processing Agreement for enterprise customers. GDPR-compliant data handling terms.',
  alternates: { canonical: `${siteUrl}/trust/dpa` },
  openGraph: {
    title: 'FormaOS | Data Processing Agreement',
    description:
      'FormaOS Data Processing Agreement for enterprise customers. GDPR-compliant data handling terms.',
    type: 'website',
    url: `${siteUrl}/trust/dpa`,
  },
};

export default function DPAPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Data Processing Agreement"
        description="FormaOS processes customer data in accordance with the Australian Privacy Act 1988 (APPs), GDPR, and other applicable data protection obligations. AU-based hosting by default. Data residency controls, sub-processor disclosure, and signed DPA available for enterprise customers."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={<CompactHeroIcon icon={<FileText className="w-8 h-8 text-emerald-400" />} color="52,211,153" />}
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <p className="text-sm text-muted-foreground mt-2 mb-12">
          Last updated: February 2026
        </p>

        <div className="space-y-10">
          <Section title="1. Definitions">
            <p>
              &quot;Controller&quot; means the entity that determines the
              purposes and means of processing personal data.
              &quot;Processor&quot; means FormaOS Pty Ltd, which processes data
              on behalf of the Controller. &quot;Sub-processor&quot; means any
              third party engaged by FormaOS to assist in processing.
            </p>
          </Section>

          <Section title="2. Scope of Processing">
            <p>
              FormaOS processes organizational compliance data, user account
              information, evidence artifacts, and audit trail records necessary
              to deliver the compliance management platform service.
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-muted-foreground">
              <li>Account and authentication data</li>
              <li>Organization and team membership data</li>
              <li>Compliance evidence and policy documents</li>
              <li>Audit logs and activity records</li>
              <li>Communication and notification preferences</li>
            </ul>
          </Section>

          <Section title="3. Data Security Measures">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { icon: Lock, label: 'AES-256 encryption at rest' },
                { icon: Globe, label: 'TLS 1.3 encryption in transit' },
                { icon: Users, label: 'Role-based access controls' },
                { icon: FileText, label: 'Immutable audit logging' },
                { icon: Server, label: 'SOC 2 reports available from hosting providers' },
                { icon: Clock, label: 'Automated backup & recovery' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <Icon
                    className="h-4 w-4 text-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Sub-processors">
            <p>
              A current list of sub-processors is maintained at{' '}
              <Link
                href="/trust/subprocessors"
                className="text-primary hover:underline"
              >
                formaos.com.au/trust/subprocessors
              </Link>
              . We provide 30 days advance notice before engaging new
              sub-processors.
            </p>
          </Section>

          <Section title="5. Data Subject Rights">
            <p>
              FormaOS supports Controllers in fulfilling data subject rights
              including access, rectification, erasure, portability, and
              restriction of processing. Requests can be submitted via the
              platform or by contacting{' '}
              <a
                href="mailto:privacy@formaos.com.au"
                className="text-primary hover:underline"
              >
                privacy@formaos.com.au
              </a>
              .
            </p>
          </Section>

          <Section title="6. Data Retention, Portability & Deletion">
            <p>
              Data retention periods are configurable and may be tailored to your
              specific regulatory obligations (e.g., 7-year ASIC record retention,
              NDIS evidence retention requirements). Upon termination or plan
              cancellation, customers have 30 days to export all compliance data,
              evidence artifacts, and audit trail records in portable formats
              (CSV, JSON, ZIP). After the export window, data is securely deleted
              and written confirmation is available on request. No lock-in penalty
              applies to data portability.
            </p>
          </Section>

          <Section title="7. Breach Notification">
            <p>
              In the event of a personal data breach, FormaOS will notify the
              Controller in accordance with applicable law and contractual
              notification terms, providing details of the breach, likely
              consequences, and mitigation measures taken.
            </p>
          </Section>

          <Section title="8. International Transfers">
            <p>
              Data is primarily processed within Australia. Where international
              transfers occur (e.g., through sub-processors), they are governed
              by Standard Contractual Clauses or equivalent safeguards.
            </p>
          </Section>
        </div>

        <div className="mt-16 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Request a signed DPA
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enterprise customers can request a countersigned DPA for their
            compliance records.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Contact us to request <CheckCircle className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
