import type { Metadata } from 'next';
import Link from 'next/link';
import { Trash2, Lock, Database, Shield, FileCheck } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | Data Handling',
  description:
    'How FormaOS handles, retains, and deletes customer data. Designed for enterprise procurement review, vendor assurance, and DPA negotiations.',
  alternates: { canonical: `${siteUrl}/trust/data-handling` },
  openGraph: {
    title: 'FormaOS | Data Handling',
    description:
      'How FormaOS handles, retains, and deletes customer data. Designed for enterprise procurement review, vendor assurance, and DPA negotiations.',
    type: 'website',
    url: `${siteUrl}/trust/data-handling`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Data Handling',
    description:
      'How FormaOS handles, retains, and deletes customer data. Designed for enterprise procurement review, vendor assurance, and DPA negotiations.',
  },
};

export default function DataHandlingPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Data Handling"
        description="Procurement-oriented overview of how FormaOS stores and protects data. This page is informational and does not replace your executed agreement."
        topColor="slate"
        bottomColor="slate"
        visualContent={
          <CompactHeroIcon
            icon={<Database className="w-8 h-8 text-slate-300" />}
            color="148,163,184"
          />
        }
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Storage and encryption
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                Customer data is encrypted at rest with AES-256 and in transit
                with TLS 1.3. Requests over plain HTTP are rejected.
              </li>
              <li>
                Production data sits in Supabase managed PostgreSQL and object
                storage, hosted in Australia by default, and is delivered
                through Vercel. Both maintain their own SOC 2 reports, which we
                can point you to during review.
              </li>
              <li>
                Evidence files and audit exports live in storage buckets with
                bucket-level policies, so an object is only readable through a
                path your organisation membership authorises.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Tenant isolation and access
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                Isolation is enforced in the database by row-level security
                policies scoped to organisation membership, not by application
                filtering. A query that omits the org predicate returns nothing
                rather than another tenant&apos;s rows.
              </li>
              <li>
                Access within an organisation is role-based, with privileged
                actions restricted to owner and admin roles and TOTP
                multi-factor available for enforcement.
              </li>
              <li>
                Administrative access to production is restricted, environments
                are separated, and security-relevant actions are recorded in the
                audit log.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Audit trail integrity
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Audit rows are chained with an HMAC-SHA256 signature over the
              preceding row, the chain top is anchored daily to an external
              transparency log, and a database trigger rejects any update or
              delete against audit rows. That is what stands behind the
              tamper-evident and chain-of-custody claims made elsewhere on the
              site.
            </p>
            <Link
              href="/trust#trust-audit-chain-heading"
              className="mt-4 inline-flex text-sm text-primary hover:underline"
            >
              Read how the audit chain is verified
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Retention and deletion
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Retention periods are configurable per organisation and can be set
              to match the rules you are subject to, for example NDIS evidence
              retention or seven-year financial records. Compliance data,
              evidence artefacts, and audit records export as CSV, JSON, or ZIP
              before deletion. Deletion timing and written confirmation on
              completion are set in your executed agreement rather than promised
              generally here.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link
            href="/trust/subprocessors"
            className="text-primary hover:underline"
          >
            Sub-processors →
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
