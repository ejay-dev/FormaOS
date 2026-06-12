'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Activity, ClipboardCheck, Layers, ShieldCheck } from 'lucide-react';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

export function CompliancePageHero() {
  const summary = useComplianceSummary();
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);
  const lastFetched = useComplianceStore((s) => s.lastFetched);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const live = lastFetched !== null;
  const open = Math.max(0, summary.total - summary.completed);
  const overdue = summary.overdue;
  const dueSoon = summary.dueSoon;
  const pct = summary.completionPercentage;

  const postureLabel = !live
    ? 'Loading'
    : pct >= 85
      ? 'Buyer-ready'
      : pct >= 70
        ? 'Approaching'
        : pct > 0
          ? 'Needs attention'
          : 'No data yet';

  const metrics: PageHeroMetric[] = [
    {
      label: 'Open',
      value: live ? open : '—',
      sub: live ? 'obligations' : 'Loading',
    },
    {
      label: 'Overdue',
      value: live ? overdue : '—',
      sub: live ? (overdue > 0 ? 'past SLA' : 'on cadence') : 'Loading',
      tone: overdue > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Due',
      value: live ? dueSoon : '—',
      sub: live ? 'this week' : 'Loading',
      tone: dueSoon > 5 ? 'warning' : 'neutral',
    },
    {
      label: 'Posture',
      value: live ? `${pct}%` : '—',
      sub: postureLabel,
    },
  ];

  return (
    <PageHero
      eyebrow="Compliance · Obligations Register"
      title="Obligations Register"
      subtitle="Track, manage, and prove compliance across all frameworks."
      metrics={metrics}
      actions={
        <>
          <Link
            href="/app/compliance/frameworks"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
          >
            <Layers className="h-3.5 w-3.5" />
            Frameworks
          </Link>
          {/* Health + Attestations live here (not as standalone cards below)
              so the landing page stays two blocks: hero + register. */}
          <Link
            href="/app/compliance/health"
            data-testid="compliance-health-link"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Activity className="h-3.5 w-3.5" />
            Health
          </Link>
          <Link
            href="/app/compliance/attestations"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Attestations
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Cross-Map
          </Link>
        </>
      }
    />
  );
}
