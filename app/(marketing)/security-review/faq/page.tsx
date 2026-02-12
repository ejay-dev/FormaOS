import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Security Review FAQ',
  description:
    'Enterprise security review FAQ for procurement, security, and compliance stakeholders evaluating FormaOS.',
  alternates: { canonical: `${siteUrl}/security-review/faq` },
};

const faqs = [
  {
    q: 'Do you support SAML SSO?',
    a: 'Yes for Enterprise plans. FormaOS supports a Service Provider (SP) SAML flow with per-org SP metadata and ACS endpoints, plus signed assertion validation.',
  },
  {
    q: 'Do you support SCIM provisioning?',
    a: 'Not currently as a first-party implementation. If SCIM is required, raise it during procurement so we can confirm scope. In the meantime, FormaOS supports a JML (Joiner/Mover/Leaver) admin workflow: owners/admins bulk-invite users, adjust roles, and deactivate access, with actions recorded in the audit trail.',
  },
  {
    q: 'What is your JML (Joiner/Mover/Leaver) workaround without SCIM?',
    a: 'Owners/admins can manage identity lifecycle directly: (1) Joiner: bulk invite users by email with initial roles, (2) Mover: change roles and access permissions as responsibilities change, (3) Leaver: deactivate/lock users and revoke active sessions. These changes are auditable, and you can export audit logs as procurement evidence.',
  },
  {
    q: 'Do you support MFA?',
    a: 'Yes. FormaOS supports TOTP-based MFA with backup codes. MFA enforcement can be applied for privileged roles depending on your governance posture.',
  },
  {
    q: 'How is tenant isolation enforced?',
    a: 'Tenant isolation is enforced at the database layer using row-level security (RLS) policies scoped to organization membership.',
  },
  {
    q: 'Is there audit logging?',
    a: 'Yes. FormaOS maintains immutable audit trails for sensitive actions and security-relevant operations. Export actions are traceable.',
  },
  {
    q: 'Is data encrypted in transit and at rest?',
    a: 'Yes. Data is encrypted in transit and at rest using infrastructure primitives and platform security controls.',
  },
  {
    q: 'Is “end-to-end encryption” supported?',
    a: 'No. FormaOS uses standard encryption in transit and at rest. We do not claim application-layer end-to-end encryption.',
  },
  {
    q: 'Do you have a SOC 2 Type II report for FormaOS as a vendor?',
    a: 'If you require a vendor SOC 2 report, raise it during procurement. FormaOS uses “aligned vs certified” wording intentionally: aligned means controls are modeled and operational artifacts can be produced, certified requires an independent audit of FormaOS as a vendor.',
  },
  {
    q: 'Do you provide a vendor assurance artifact (pen test / independent assessment)?',
    a: 'We provide a vendor assurance process and can share independent assessment artifacts under NDA when available. See the Vendor Assurance page in the Trust Center for scope, cadence, and request process. We avoid public certification claims unless an independent audit report exists for FormaOS as a vendor.',
  },
  {
    q: 'Do your infrastructure providers have compliance reports?',
    a: 'Yes. Our infrastructure vendors maintain their own compliance reports (e.g., SOC 2) which can be provided via vendor documentation as part of your review process.',
  },
  {
    q: 'Where is customer data hosted?',
    a: 'Customer data is hosted on Supabase (PostgreSQL + object storage) and delivered via Vercel. If your review requires exact regions, request the current region and subprocessor details.',
  },
  {
    q: 'Do you provide a subprocessor list?',
    a: 'Yes. A maintained subprocessor list is available in the Trust Center.',
  },
  {
    q: 'Do you sign a Data Processing Agreement (DPA)?',
    a: 'Yes. We provide a standard DPA summary for enterprise review and can countersign as part of procurement.',
  },
  {
    q: 'What is your incident response process?',
    a: 'FormaOS follows a documented incident response process with investigation, remediation, and customer communication in accordance with contractual and legal requirements.',
  },
  {
    q: 'What is your incident notification timeframe?',
    a: 'Notification timelines are governed by contract terms and applicable law. We avoid universal promises on a public page so that commitments remain contract-accurate.',
  },
  {
    q: 'Do you have an uptime SLA?',
    a: 'Enterprise agreements can include SLA terms. We also publish status and uptime checks on our public status page.',
  },
  {
    q: 'Do you have a public status page?',
    a: 'Yes. A status page with published uptime checks is available publicly.',
  },
  {
    q: 'How do you handle backups and recovery?',
    a: 'Backups and recovery are handled via infrastructure capabilities and operational processes. Details can be provided during procurement.',
  },
  {
    q: 'How do you limit access internally?',
    a: 'Administrative access is controlled by role-based access controls and environment separation. Production access is restricted and security-relevant actions are auditable.',
  },
  {
    q: 'Do you support data export and portability?',
    a: 'Yes. FormaOS supports audit-ready exports and enterprise data exports for portability, subject to access controls and compliance gates.',
  },
  {
    q: 'Can we delete our data?',
    a: 'Yes. Deletion workflows are supported and timelines are defined contractually. Written confirmation can be provided upon completion.',
  },
  {
    q: 'Do you support customer-managed encryption keys (CMEK)?',
    a: 'Not currently. If CMEK is required, raise it during procurement so we can confirm feasibility against infrastructure constraints.',
  },
  {
    q: 'Do you support logging exports for SIEM?',
    a: 'Audit logs are exportable. If you need SIEM streaming, confirm requirements during security review.',
  },
  {
    q: 'Do you support sandbox environments?',
    a: 'Not currently as a first-party “sandbox” mode. Enterprise rollouts typically use separate environments by agreement.',
  },
  {
    q: 'What access model do users have?',
    a: 'FormaOS uses role-based access controls (RBAC). Permissions are scoped to organization membership and privileged actions are restricted to owner/admin roles.',
  },
] as const;

export default function SecurityReviewFaqPage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Security Review FAQ
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Written for security, compliance, and procurement reviewers. This
            page avoids inflated claims and uses contract-accurate language.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors">
                <span className="font-medium text-foreground pr-4">{f.q}</span>
                <span className="text-muted-foreground shrink-0 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/security-review" className="text-primary hover:underline">
            ← Back to Security Review Packet
          </Link>
          <Link href="/trust" className="text-primary hover:underline">
            Visit Trust Center →
          </Link>
          <Link href="/trust/vendor-assurance" className="text-primary hover:underline">
            Vendor Assurance →
          </Link>
        </div>
      </div>
    </main>
  );
}
