import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FormaOS | Procurement FAQ',
  description:
    'Answers to common procurement and security review questions for enterprise buyers.',
};

const faqs = [
  {
    question: 'What compliance frameworks does FormaOS support?',
    answer:
      'FormaOS supports ISO 27001, SOC 2 Type II, GDPR, HIPAA, PCI DSS, NIST CSF, and CIS Controls. Each framework includes pre-mapped controls, evidence requirements, and audit-ready reporting.',
  },
  {
    question: 'Where is customer data stored?',
    answer:
      'Customer data is stored in Supabase (hosted on AWS ap-southeast-2 in Sydney, Australia). All data is encrypted at rest using AES-256 and in transit using TLS 1.3.',
  },
  {
    question: 'Do you have a SOC 2 report?',
    answer:
      'FormaOS is built on SOC 2 Type II certified infrastructure (Supabase/AWS, Vercel). Our own SOC 2 Type II report is on our certifications roadmap. Contact us for our current security posture documentation.',
  },
  {
    question: 'Can we sign a DPA?',
    answer:
      'Yes. We provide a standard Data Processing Agreement that covers GDPR and Australian Privacy Act requirements. Enterprise customers can request a countersigned copy via our contact page.',
  },
  {
    question: 'What are your data retention policies?',
    answer:
      'Data is retained for the duration of the service agreement plus 90 days. Upon contract termination, all customer data is securely deleted with certification available upon request.',
  },
  {
    question: 'Do you support SSO/SAML?',
    answer:
      'Google OAuth is available for all plans. Enterprise SSO via SAML is on our roadmap for H2 2026. Contact us to discuss your SSO requirements.',
  },
  {
    question: 'How do you handle security incidents?',
    answer:
      'We notify affected customers within 72 hours of confirming a security incident, provide detailed impact assessments, and publish post-incident reports. Our incident history is available on the Trust Center.',
  },
  {
    question: 'What is your uptime SLA?',
    answer:
      'FormaOS targets 99.9% uptime. Real-time status and historical uptime data is available on our status page. Enterprise plans include SLA-backed uptime guarantees.',
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
