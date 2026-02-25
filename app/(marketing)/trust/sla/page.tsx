import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | SLA',
  description: 'SLA and availability expectations for FormaOS enterprise plans.',
  alternates: { canonical: `${siteUrl}/trust/sla` },
  openGraph: {
    title: 'FormaOS | SLA',
    description: 'SLA and availability expectations for FormaOS enterprise plans.',
    type: 'website',
    url: `${siteUrl}/trust/sla`,
  },
};

const tiers = [
  {
    tier: 'Starter / Pro',
    points: [
      'No contractual SLA by default.',
      'Public status page and published uptime checks available.',
      'Support channels and response times depend on plan and support package.',
    ],
  },
  {
    tier: 'Enterprise',
    points: [
      'SLA terms can be included in the MSA/SOW (uptime, support response, escalation).',
      'Security review artifacts available via Trust Center and vendor trust packet.',
      'Identity requirements (e.g., SAML SSO) supported for enterprise plans.',
    ],
  },
] as const;

export default function SlaPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="SLA"
        description="This page is a summary of how availability commitments are typically structured. Contract terms are defined in your executed agreement."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={<CompactHeroIcon icon={<Clock className="w-8 h-8 text-emerald-400" />} color="52,211,153" />}
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-4">
          {tiers.map((t) => (
            <section
              key={t.tier}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-foreground">{t.tier}</h2>
              <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">
              Status And Uptime Signals
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Live status and historical uptime checks are published on the status
            page. Uptime signals are not a contractual SLA unless incorporated
            into your agreement.
          </p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
          <Link href="/status" className="text-primary hover:underline">
            Status →
          </Link>
          <Link href="/security-review" className="text-primary hover:underline">
            Security Review Packet →
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Need a signed SLA addendum? Use the security review walkthrough to
          align on procurement requirements.
        </p>
      </div>
    </MarketingPageShell>
  );
}
