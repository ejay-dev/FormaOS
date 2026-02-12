import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Case Study Template',
  description:
    'Buyer-grade case study template for regulated operators: before/after, mechanism, measurable metrics, and timeframe.',
  alternates: { canonical: `${siteUrl}/customer-stories/template` },
  openGraph: {
    title: 'FormaOS | Case Study Template',
    description:
      'Buyer-grade case study template for regulated operators: before/after, mechanism, measurable metrics, and timeframe.',
    type: 'website',
    url: `${siteUrl}/customer-stories/template`,
  },
};

const template = [
  {
    title: '1) Snapshot',
    bullets: [
      'Industry: (NDIS / aged care / healthcare / other)',
      'Size: (sites, staff, clients/participants)',
      'Frameworks/regulators: (NDIS, ISO, SOC 2, internal)',
      'Time to first proof: (14 days / 30 days)',
    ],
  },
  {
    title: '2) Before',
    bullets: [
      'Audit prep was manual: evidence spread across folders/spreadsheets',
      'Control ownership unclear, tasks duplicated, due dates missed',
      'Incidents and training registers were hard to evidence consistently',
    ],
  },
  {
    title: '3) After',
    bullets: [
      'Evidence mapped to controls with approvals and timestamps',
      'Governance cadence: monthly pack + audit-ready bundle on demand',
      'Reduced expired credentials and faster incident closure cycles',
    ],
  },
  {
    title: '4) Mechanism (What Changed Operationally)',
    bullets: [
      'Operational workflows captured and tied to compliance controls',
      'Evidence captured as a byproduct of work and verified',
      'Audit trail + exports used as procurement and auditor proof',
    ],
  },
  {
    title: '5) Metrics (Measured, Not Marketed)',
    bullets: [
      'Audit prep hours saved per month: (___ hours)',
      'Evidence retrieval time reduction: (___% / ___ hours)',
      'Expired credential rate reduction: (___% / ___ fewer expiries)',
      'Incident time-to-close improvement: (___ days)',
    ],
  },
  {
    title: '6) ROI Model Inputs (Optional)',
    bullets: [
      'Fully loaded hourly wage assumptions (low/median/high)',
      'Audit cycle frequency (quarterly / annual)',
      'Staff count involved in evidence collection and reviews',
    ],
  },
] as const;

export default function CaseStudyTemplatePage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Case Study Template (Buyer-Grade)
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Use this template to build credible outcome proof without inflated
            claims. It is designed to match how procurement and auditors
            evaluate impact: before/after, mechanism, measurable KPI, and
            timeframe.
          </p>
        </header>

        <div className="space-y-4">
          {template.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-base font-semibold text-foreground">
                {s.title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row text-sm">
          <Link href="/customer-stories" className="text-primary hover:underline">
            ← Back to Customer Stories
          </Link>
          <Link href="/security-review" className="text-primary hover:underline">
            Security Review Packet →
          </Link>
          <Link href="/trust" className="text-primary hover:underline">
            Trust Center →
          </Link>
          <Link href="/contact" className="text-primary hover:underline">
            Request Help →
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
          Tip: Keep a single spreadsheet of raw inputs (hours, wages, audit
          cycle frequency) and reuse it across case studies to keep ROI claims
          consistent and defensible.
        </div>
      </div>
    </main>
  );
}

