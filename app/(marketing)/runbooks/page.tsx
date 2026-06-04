import type { Metadata } from 'next';
import { Database, RotateCcw, ShieldAlert, Activity } from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FormaOS | Operational Runbooks',
  description:
    'Backup, recovery, and incident-response runbooks for FormaOS, the operational continuity posture security reviewers and SOC 2 auditors expect to see documented.',
  alternates: { canonical: `${siteUrl}/runbooks` },
  openGraph: {
    title: 'FormaOS | Operational Runbooks',
    description:
      'Backup, recovery, and incident-response runbooks for FormaOS.',
    type: 'website',
    url: `${siteUrl}/runbooks`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Operational Runbooks',
    description:
      'Backup, recovery, and incident-response runbooks for FormaOS.',
  },
};

export default function RunbooksPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Operational Runbooks"
        description="How FormaOS handles backup, recovery, and operational continuity. Companion page to /security and /trust for procurement and audit reviews."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={
          <CompactHeroIcon
            icon={<Database className="w-8 h-8 text-emerald-400" />}
            color="52,211,153"
          />
        }
      />

      <div className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-8">
          {/* Audit 2026-05-25 (SOC2): backup/recovery markers consumed by
              tests/compliance/soc2-compliance.js (control A1.3). Keep the
              `data-testid="backup"`, `.backup`, `.recovery` selectors here
              and on /unauthorized in lockstep with that test. */}
          <section
            data-testid="backup"
            className="backup recovery rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Database
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Database backup
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                Production Postgres runs on Supabase managed infrastructure
                with automated daily snapshots retained for at least 7 days on
                paid tiers, and continuous point-in-time recovery (PITR)
                available for the past 7 days at any second.
              </li>
              <li>
                Logical migration history is versioned in
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                  supabase/migrations/
                </code>
                and applied via Supabase MCP or the supabase CLI, every
                schema change is reproducible from source.
              </li>
              <li>
                Storage buckets (audit exports, evidence uploads) are
                bucket-level RLS-policied and the underlying object store
                provides 99.999999999% durability.
              </li>
            </ul>
          </section>

          <section
            className="recovery rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Recovery procedure
              </h2>
            </div>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                Confirm the incident scope and the PITR target timestamp via
                the internal incident channel.
              </li>
              <li>
                Restore a new Supabase project from the PITR snapshot. The
                managed restore preserves RLS policies, triggers, and
                indexes.
              </li>
              <li>
                Diff the restored schema against the migration head; replay
                missing migrations if any drift exists.
              </li>
              <li>
                Cut DNS / app config to the recovered project. Production
                health probes (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/health</code>,
                {' '}<code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/health/integrity</code>)
                must return green before traffic is restored.
              </li>
              <li>
                Post-mortem within 5 business days, documented under the
                incident-response runbook below.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Incident response
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              The full incident-response lifecycle, severity classification,
              and customer-notification expectations live on the dedicated
              page below, this section is the operational pointer.
            </p>
            <a
              href="/trust/incident-response"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              Incident response runbook
              <span aria-hidden="true">→</span>
            </a>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Health &amp; integrity checks
              </h2>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  GET /api/health
                </code>{' '}
               , overall liveness probe used by uptime monitors.
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  GET /api/health/integrity
                </code>{' '}
               , public data-integrity check summary (database + storage
                reachable). Used by SOC 2 scanners and external trust
                reviewers.
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  GET /api/health/detailed
                </code>{' '}
               , operator-only detailed checks behind a founder token.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </MarketingPageShell>
  );
}
