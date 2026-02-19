import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, FileText } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Procurement FAQ',
  description:
    'Answers to common procurement and security review questions for enterprise buyers.',
  alternates: { canonical: `${siteUrl}/trust/procurement` },
  openGraph: {
    title: 'FormaOS | Procurement FAQ',
    description:
      'Answers to common procurement and security review questions for enterprise buyers.',
    type: 'website',
    url: `${siteUrl}/trust/procurement`,
  },
};

const faqs = [
  {
    question: 'What compliance frameworks does FormaOS support?',
    answer:
      'FormaOS supports ISO 27001, SOC 2, GDPR, HIPAA, PCI DSS, NIST CSF, and CIS Controls. Each pack includes mapped controls, evidence requirements, and audit-ready reporting outputs.',
  },
  {
    question: 'Where is customer data stored?',
    answer:
      'Customer data is stored in Supabase (PostgreSQL + object storage). Data is encrypted at rest and in transit. If your procurement process requires the exact hosting region, contact us and we will provide your current project region and subprocessor details.',
  },
  {
    question: 'Do you have a SOC 2 report?',
    answer:
      'FormaOS is built on infrastructure providers that maintain their own SOC 2 reports (e.g., hosting). FormaOS provides a procurement-ready security packet describing our application controls and data handling. If you require a vendor attestation beyond “aligned”, we can share current third-party assessment artifacts available under NDA.',
  },
  {
    question: 'Can we sign a DPA?',
    answer:
      'Yes. We provide a standard Data Processing Agreement that covers GDPR and Australian Privacy Act requirements. Enterprise customers can request a countersigned copy via our contact page.',
  },
  {
    question: 'What are your data retention policies?',
    answer:
      'Data retention and deletion timelines are defined contractually. By default, data is retained for the duration of your subscription. On termination, we support deletion requests and can provide written confirmation of deletion completion for your records.',
  },
  {
    question: 'Do you support SSO/SAML?',
    answer:
      'Google OAuth is available for all plans. Enterprise plans can enable SAML SSO (metadata-based configuration, SP metadata + ACS endpoints, and signed assertion validation).',
  },
  {
    question: 'How do you handle security incidents?',
    answer:
      'We follow a documented incident response process and notify customers in accordance with contract terms and applicable law. We provide impact assessments, mitigation actions, and post-incident learnings where appropriate.',
  },
  {
    question: 'What is your uptime SLA?',
    answer:
      'FormaOS targets high uptime and publishes status and uptime checks on our status page. Enterprise agreements can include SLA terms in your MSA/SOW.',
  },
  {
    question: 'How long does security review take?',
    answer:
      'Most security reviews can be completed within 5-7 business days. We provide a pre-built Trust Packet with security overview, compliance mappings, and policy summaries to accelerate the process.',
  },
  {
    question: 'What can I prove to my auditor in 14 days?',
    answer:
      'Within 14 days on FormaOS, most organizations can: enable their primary framework, map existing evidence to controls, generate a compliance posture report, and export an audit-ready evidence package.',
  },
];

export default function ProcurementFAQPage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Procurement FAQ
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Common questions from procurement, security, and legal teams
            evaluating FormaOS.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors">
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <span className="text-muted-foreground shrink-0 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {/* What you can prove in 14 days */}
        <div className="mt-16 p-8 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-foreground">
              What you can prove in 14 days
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              {
                day: 'Day 1-2',
                action: 'Enable framework + import existing evidence',
              },
              {
                day: 'Day 3-5',
                action: 'Map controls to evidence + create core policies',
              },
              {
                day: 'Day 6-8',
                action: 'Assign owners + set up automation triggers',
              },
              { day: 'Day 9-11', action: 'Generate compliance posture report' },
              {
                day: 'Day 12-14',
                action: 'Export audit-ready trust packet for stakeholders',
              },
            ].map(({ day, action }) => (
              <div
                key={day}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border"
              >
                <CheckCircle
                  className="h-4 w-4 text-success mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{day}</p>
                  <p className="text-xs text-muted-foreground">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link href="/trust" className="text-sm text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link
            href="/contact"
            className="text-sm text-primary hover:underline"
          >
            Contact for custom security review →
          </Link>
        </div>
      </div>
    </main>
  );
}
