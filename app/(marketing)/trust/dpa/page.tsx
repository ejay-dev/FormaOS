import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Globe,
  Server,
  Lock,
} from 'lucide-react';

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
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Data Processing Agreement
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            FormaOS processes customer data in accordance with applicable data
            protection laws, including GDPR, Australian Privacy Act, and HIPAA
            where applicable.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: February 2026
          </p>
        </div>

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

          <Section title="6. Data Retention & Deletion">
            <p>
              Data retention and deletion timelines are defined in the service
              agreement (and may be tailored to regulatory requirements).
              Upon termination, FormaOS supports deletion requests and can
              provide written confirmation of deletion completion upon request.
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
    </main>
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
