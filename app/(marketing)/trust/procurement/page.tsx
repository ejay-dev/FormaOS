import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, ClipboardList } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Procurement FAQ',
  description:
    'How a FormaOS security review runs: what you receive, how long it takes, DPA signing, and what teams stand up during early evaluation.',
  alternates: { canonical: `${siteUrl}/trust/procurement` },
  openGraph: {
    title: 'FormaOS | Procurement FAQ',
    description:
      'How a FormaOS security review runs: what you receive, how long it takes, DPA signing, and what teams stand up during early evaluation.',
    type: 'website',
    url: `${siteUrl}/trust/procurement`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Procurement FAQ',
    description:
      'How a FormaOS security review runs: what you receive, how long it takes, DPA signing, and what teams stand up during early evaluation.',
  },
};

// Technical and security answers are not duplicated here. They live on
// /security-review/faq, which is the single source; divergent answers to the
// same question are exactly what a vendor-risk process is built to catch.
const faqs = [
  {
    question: 'What do we receive when a review starts?',
    answer:
      'The Trust Packet: a security overview, architecture and data-handling description, framework control mappings, policy summaries, and the DPA. It is written so your reviewers can start from current material rather than a blank questionnaire.',
  },
  {
    question: 'How long does security review take?',
    answer:
      'It depends on the scope of your questionnaire, your legal process, and the artifacts you request. Sending your questionnaire early, with the sections you consider blocking marked, is the fastest path.',
  },
  {
    question: 'Can we sign a DPA?',
    answer:
      'Yes. A standard Data Processing Agreement covering GDPR and Australian Privacy Act requirements is published in the Trust Center, and a countersigned copy can be requested for your records.',
  },
  {
    question: 'Who do we talk to, and what happens next?',
    answer:
      'Requests go through the contact form with the security review option selected. You get a direct reply, the Trust Packet, and a scoping conversation about frameworks, sites, and the teams involved before anything commercial is proposed.',
  },
  {
    question: 'What can teams usually stand up during early evaluation?',
    answer:
      'Enable a primary framework, map existing evidence to controls, generate a posture snapshot, and review export-ready evidence packages. The pace depends on implementation scope and the quality of the source material you bring.',
  },
];

const technicalAnswers = [
  {
    href: '/security-review/faq',
    label: 'Security Review FAQ',
    detail:
      'SSO and SCIM, MFA, tenant isolation, encryption, SOC 2 position, hosting, backups, exports, and the capabilities we do not have.',
  },
  {
    href: '/trust/data-handling',
    label: 'Data handling',
    detail: 'Storage, encryption, isolation, audit integrity, retention, and deletion.',
  },
  {
    href: '/trust/sla',
    label: 'Service levels',
    detail: 'Availability expectations and support commitments by plan.',
  },
  {
    href: '/trust/incident-response',
    label: 'Incident response',
    detail: 'Detection, containment, severity classification, and disclosure.',
  },
] as const;

export default function ProcurementFAQPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Procurement"
        description="How a review runs with us: what you receive, who you talk to, and what happens next. Technical answers live in the Security Review FAQ."
        topColor="slate"
        bottomColor="slate"
        visualContent={
          <CompactHeroIcon
            icon={<ClipboardList className="w-8 h-8 text-slate-300" />}
            color="148,163,184"
          />
        }
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <section className="mb-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Security and technical questions are answered in one place
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This page covers how a review runs with us. Every technical answer
            lives in the documents below, so procurement and security teams are
            quoting the same wording.
          </p>
          <ul className="mt-5 space-y-3">
            {technicalAnswers.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {item.label}
                </Link>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <h2 className="mb-4 text-lg font-semibold text-foreground">
          How the review process works
        </h2>
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

        {/* Early evaluation outcomes */}
        <div className="mt-16 p-8 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-foreground">
              What teams usually stand up during early evaluation
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              {
                day: 'Initial setup',
                action: 'Enable framework + import existing evidence',
              },
              {
                day: 'Framework mapping',
                action: 'Map controls to evidence + create core policies',
              },
              {
                day: 'Ownership design',
                action: 'Assign owners + set up automation triggers',
              },
              {
                day: 'Posture review',
                action: 'Generate compliance posture report',
              },
              {
                day: 'Buyer review',
                action:
                  'Review export-ready evidence packages for stakeholders',
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
            href="/enterprise-proof"
            className="text-sm text-primary hover:underline"
          >
            Open enterprise operations proof →
          </Link>
          <Link
            href="/contact?type=security-review&source=trust_procurement"
            className="text-sm text-primary hover:underline"
          >
            Contact for custom security review →
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
