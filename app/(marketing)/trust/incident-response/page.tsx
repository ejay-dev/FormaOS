import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, PhoneCall } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Incident Response',
  description:
    'Incident response summary and communication expectations for enterprise procurement.',
  alternates: { canonical: `${siteUrl}/trust/incident-response` },
  openGraph: {
    title: 'FormaOS | Incident Response',
    description:
      'Incident response summary and communication expectations for enterprise procurement.',
    type: 'website',
    url: `${siteUrl}/trust/incident-response`,
  },
};

export default function IncidentResponsePage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Incident Response"
        description="Summary for security and procurement reviewers. Contractual notification terms are defined in your MSA/SOW."
        topColor="emerald"
        bottomColor="cyan"
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
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
    </MarketingPageShell>
  );
}
