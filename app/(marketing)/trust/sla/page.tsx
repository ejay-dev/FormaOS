import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | SLA',
  description:
    'Service-level agreements, support expectations, and availability review guidance for FormaOS Growth, Scale, and Enterprise plans.',
  alternates: { canonical: `${siteUrl}/trust/sla` },
  openGraph: {
    title: 'FormaOS | SLA',
    description:
      'Service-level agreements, support expectations, and availability review guidance for FormaOS Growth, Scale, and Enterprise plans.',
    type: 'website',
    url: `${siteUrl}/trust/sla`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | SLA',
    description:
      'Service-level agreements, support expectations, and availability review guidance for FormaOS Growth, Scale, and Enterprise plans.',
  },
};

const tiers = [
  {
    tier: 'Foundation',
    points: [
      'No contractual SLA by default.',
      'Standard email support (business hours); response time varies.',
      'Platform access to FormaOS Trust Center for buyer review.',
    ],
  },
  {
    tier: 'Growth',
    points: [
      'No contractual SLA by default; best-effort service model.',
      'Priority email support with faster handling than Foundation.',
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
        topColor="slate"
        bottomColor="slate"
        visualContent={
          <CompactHeroIcon
            icon={<Clock className="w-8 h-8 text-slate-300" />}
            color="148,163,184"
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

        {/* "Status And Uptime Signals" block removed 2026-05-13 with
            the /status route; will return when a real status provider
            is wired. */}

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
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
