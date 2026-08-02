import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'FormaOS | SLA',
  description:
    'Service-level agreements, support expectations, and availability review guidance for FormaOS Foundation, Growth, Scale, and Enterprise plans.',
  alternates: { canonical: `${siteUrl}/trust/sla` },
  openGraph: {
    title: 'FormaOS | SLA',
    description:
      'Service-level agreements, support expectations, and availability review guidance for FormaOS Foundation, Growth, Scale, and Enterprise plans.',
    type: 'website',
    url: `${siteUrl}/trust/sla`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | SLA',
    description:
      'Service-level agreements, support expectations, and availability review guidance for FormaOS Foundation, Growth, Scale, and Enterprise plans.',
  },
};

// Tier names come from PLAN_CATALOG so this page cannot drift from the
// plans sold on /pricing.
const tiers: { planKey: PlanKey; points: string[] }[] = [
  {
    planKey: 'basic',
    points: [
      'No contractual SLA by default.',
      'Standard email support (business hours); response time varies.',
      'Platform access to FormaOS Trust Center for buyer review.',
    ],
  },
  {
    planKey: 'pro',
    points: [
      'No contractual SLA by default; best-effort service model.',
      'Priority email support with faster handling than Foundation.',
      'Security review artifacts available via Trust Center for procurement.',
    ],
  },
  {
    planKey: 'scale',
    points: [
      'No contractual SLA by default; the same best-effort service model as Growth.',
      'Priority email support, covering every site on the plan.',
      'Security review artifacts available via Trust Center for procurement.',
      'Contractual availability targets require an Enterprise agreement.',
    ],
  },
  {
    planKey: 'enterprise',
    points: [
      'Executed agreements can define availability targets and support expectations.',
      'Incident handling, escalation paths, and reporting cadence are documented during contracting.',
      'Dedicated success support and named escalation path.',
      'Maintenance communications and planned change notices follow the agreed service terms.',
      'SAML 2.0 SSO, MFA enforcement, and AU-hosted deployment options are reviewed during solution design.',
      'Service reporting and any contractual remedies are handled through the executed agreement.',
    ],
  },
];

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
              key={t.planKey}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {PLAN_CATALOG[t.planKey].name}
              </h2>
              <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Status and uptime signals
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Live platform health is published without sign-in at{' '}
            <Link href="/status" className="text-primary hover:underline">
              formaos.com.au/status
            </Link>
            . It reports current subsystem checks and audit-chain anchoring
            rather than a historical uptime percentage.
          </p>
        </section>

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
