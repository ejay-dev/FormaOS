import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, FileText, CalendarDays } from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Vendor Assurance',
  description:
    'Vendor assurance process, independent assessment approach, and procurement-ready artifacts for enterprise review.',
  alternates: { canonical: `${siteUrl}/trust/vendor-assurance` },
  openGraph: {
    title: 'FormaOS | Vendor Assurance',
    description:
      'Vendor assurance process, independent assessment approach, and procurement-ready artifacts for enterprise review.',
    type: 'website',
    url: `${siteUrl}/trust/vendor-assurance`,
  },
};

export default function VendorAssurancePage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">
              Vendor Assurance
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            This page describes our vendor assurance process and the artifacts
            we provide during procurement. We do not claim SOC 2 or ISO
            certification for FormaOS unless an independent audit report exists
            for FormaOS as a vendor.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Independent Security Assessment Plan (Process)
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Enterprise customers often require independent assurance beyond
                internal documentation. Our approach is to provide a scoped,
                repeatable assessment cadence and share artifacts under NDA.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Scope
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                    <li>Application security posture (OWASP-style)</li>
                    <li>Auth/SSO flows and session security</li>
                    <li>Data access controls and audit logging</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cadence
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                    <li>Initial independent assessment</li>
                    <li>Annual refresh (or after major changes)</li>
                    <li>Remediation tracking and re-test where applicable</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Artifacts
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                    <li>Executive summary</li>
                    <li>Findings + remediation plan</li>
                    <li>Verification notes on fixes</li>
                  </ul>
                </div>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                Note: Availability of third-party artifacts depends on timing
                and customer procurement requirements. We will not represent an
                assessment as “certification.”
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-7">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                How To Request Vendor Assurance Artifacts
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                During procurement, send your questionnaire and required
                artifact list. We can provide a Trust Packet PDF, subprocessor
                disclosures, DPA summary, and independent assessment artifacts
                (under NDA when applicable).
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Request Vendor Assurance
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/trust/packet"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
                >
                  Download Trust Packet
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`${appBase}/auth/signup?source=vendor_assurance`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/30"
                >
                  Start Trial
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
        </div>
      </div>
    </main>
  );
}

