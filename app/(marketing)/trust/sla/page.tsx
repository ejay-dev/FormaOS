import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | SLA',
  description:
    'Service levels, support expectations, and availability review guidance for FormaOS plans.',
  alternates: { canonical: `${siteUrl}/trust/sla` },
  openGraph: {
    title: 'FormaOS | SLA',
    description:
      'Service levels, support expectations, and availability review guidance for FormaOS plans.',
    type: 'website',
    url: `${siteUrl}/trust/sla`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | SLA',
    description:
      'Service levels, support expectations, and availability review guidance for FormaOS plans.',
  },
};

const tiers = [
  {
    tier: 'Starter',
    points: [
      'No contractual SLA by default.',
      'Public status page and published uptime checks available.',
      'Standard email support (business hours); response time varies.',
      'Platform access to FormaOS Trust Center for procurement self-service.',
    ],
  },
  {
    tier: 'Professional',
    points: [
      'No contractual SLA by default; best-effort service model.',
      'Priority email support with faster handling than Starter.',
      'Public status page, incident history, and uptime reports available.',
      'Security review artifacts available via Trust Center for procurement.',
    ],
  },
  {
    tier: 'Enterprise',
    points: [
      'Executed agreements can define availability targets and support expectations.',
      'Incident handling, escalation paths, and reporting cadence are documented during contracting.',
      'Dedicated success support and named escalation path.',
      'Maintenance communications and planned change notices follow the agreed service terms.',
      'SAML 2.0 SSO, MFA enforcement, and AU-hosted deployment options are reviewed during solution design.',
      'Service reporting and any contractual remedies are handled through the executed agreement.',
    ],
  },
] as const;

export default function SlaPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="SLA"
        description="Enterprise plans can include documented service levels and support expectations in the executed agreement. Other plans operate on a best-effort basis."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={
          <CompactHeroIcon
            icon={<Clock className="w-8 h-8 text-emerald-400" />}
            color="52,211,153"
          />
        }
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-4">
          {tiers.map((t) => (
            <section
              key={t.tier}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {t.tier}
              </h2>
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
          <Link
            href="/security-review"
            className="text-primary hover:underline"
          >
            Security Review Packet →
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Need a signed service schedule or support addendum? Use the security
          review walkthrough to align on procurement requirements.
        </p>
      </div>
    </MarketingPageShell>
  );
}
