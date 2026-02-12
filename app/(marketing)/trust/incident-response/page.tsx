import type { Metadata } from 'next';
import Link from 'next/link';
import { Siren, ShieldAlert, PhoneCall } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Incident Response',
  description:
    'Incident response summary and communication expectations for enterprise procurement.',
  alternates: { canonical: `${siteUrl}/trust/incident-response` },
};

export default function IncidentResponsePage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Siren className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Incident Response Summary
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Summary for security and procurement reviewers. Contractual
            notification terms are defined in your MSA/SOW.
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Response Lifecycle
              </h2>
            </div>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Detection and triage</li>
              <li>Containment and mitigation</li>
              <li>Impact assessment (scope, affected data, blast radius)</li>
              <li>Customer communication per contract and legal requirements</li>
              <li>Remediation, follow-up validation, and learnings</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <PhoneCall className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Communication Expectations
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Notification timelines and escalation contacts are defined in your
              enterprise agreement. We avoid universal promises on a public page
              to keep commitments contract-accurate.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link href="/status" className="text-primary hover:underline">
            Status →
          </Link>
        </div>
      </div>
    </main>
  );
}

