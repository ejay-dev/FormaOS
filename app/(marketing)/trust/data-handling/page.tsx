import type { Metadata } from 'next';
import Link from 'next/link';
import { Trash2, Lock } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Data Handling',
  description:
    'Data handling, retention, and deletion summary for enterprise procurement.',
  alternates: { canonical: `${siteUrl}/trust/data-handling` },
  openGraph: {
    title: 'FormaOS | Data Handling',
    description:
      'Data handling, retention, and deletion summary for enterprise procurement.',
    type: 'website',
    url: `${siteUrl}/trust/data-handling`,
  },
};

export default function DataHandlingPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Data Handling"
        description="Procurement-oriented overview of how FormaOS stores and protects data. This page is informational and does not replace your executed agreement."
        topColor="emerald"
        bottomColor="cyan"
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Storage And Encryption
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Data is encrypted in transit and at rest using platform primitives.</li>
              <li>Access is governed by organization membership and role-based controls.</li>
              <li>Audit logs provide traceability for sensitive actions and exports.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Retention And Deletion
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Retention periods and deletion timelines are governed by contract
              terms and may be tailored to your regulatory requirements. On
              termination, FormaOS supports deletion requests and can provide
              written confirmation upon completion.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link href="/trust/subprocessors" className="text-primary hover:underline">
            Subprocessors →
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
