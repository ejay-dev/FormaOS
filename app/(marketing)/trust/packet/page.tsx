import type { Metadata } from 'next';
import Link from 'next/link';
import { FileDown, ArrowRight } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Trust Packet',
  description:
    'Download the FormaOS vendor trust packet for enterprise procurement and security review.',
  alternates: { canonical: `${siteUrl}/trust/packet` },
  openGraph: {
    title: 'FormaOS | Trust Packet',
    description:
      'Download the FormaOS vendor trust packet for enterprise procurement and security review.',
    type: 'website',
    url: `${siteUrl}/trust/packet`,
  },
};

export default function TrustPacketPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Vendor Trust Packet"
        description='Procurement-ready PDF generated from current system status and the maintained subprocessor list. This packet uses "aligned vs certified" wording intentionally.'
        topColor="emerald"
        bottomColor="cyan"
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                FormaOS Vendor Trust Packet (PDF)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Includes: security posture overview, aligned vs certified
                clarification, uptime signals, and subprocessors list.
              </p>
            </div>
            <a
              href="/api/trust-packet/vendor"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link href="/security-review" className="text-primary hover:underline">
            Security Review Packet <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
