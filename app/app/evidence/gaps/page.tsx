import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  identifyGaps,
  calculateCoverage,
} from '@/lib/evidence/coverage-calculator';
import {
  getExpiringEvidence,
  getExpiredEvidence,
} from '@/lib/evidence/freshness-engine';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import {
  StatusBadge,
  severityStatus,
} from '@/components/compliance/StatusBadge';

export const metadata = { title: 'Evidence Gaps | FormaOS' };

export default async function EvidenceGapsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const [gaps, coverage, expiring, expired] = await Promise.all([
    identifyGaps(state.organization.id),
    calculateCoverage(state.organization.id),
    getExpiringEvidence(state.organization.id, 30),
    getExpiredEvidence(state.organization.id),
  ]);

  const criticalGaps = gaps.filter(
    (g) => g.severity === 'critical' || g.severity === 'high',
  );

  const reasonLabel: Record<string, string> = {
    no_evidence: 'No evidence',
    expired_evidence: 'Evidence expired',
    needs_review: 'Needs review',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence gaps</h1>
          <p className="page-description">
            Controls without adequate evidence coverage.
          </p>
        </div>
        <Link
          href="/app/vault"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload evidence
        </Link>
      </div>

      <div className="page-content space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Coverage</span>
          </div>
          {coverage.unavailable ? (
            <>
              <p className="mt-1 text-3xl font-bold text-muted-foreground">
                &mdash;
              </p>
              <p className="text-xs text-muted-foreground">
                Not available &mdash; evidence is not currently linked to
                controls, so coverage cannot be measured.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold">{coverage.coverage}%</p>
              <p className="text-xs text-muted-foreground">
                {coverage.coveredControls}/{coverage.totalControls} controls
              </p>
            </>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Total Gaps</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-destructive">
            {gaps.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Expiring Soon</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-warning">
            {expiring.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Expired</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-destructive">
            {expired.length}
          </p>
        </div>
      </div>

      {/* Critical gaps */}
      {criticalGaps.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Critical and high priority gaps ({criticalGaps.length})
          </h2>
          <div className="space-y-2">
            {criticalGaps.slice(0, 10).map((gap) => (
              <div
                key={gap.controlId}
                className="flex items-center justify-between gap-3 rounded bg-background/50 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {gap.controlCode}
                  </span>
                  <span className="truncate text-sm">{gap.controlTitle}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge {...severityStatus(gap.severity)} />
                  <span className="text-xs text-muted-foreground">
                    {reasonLabel[gap.reason]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All gaps table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">All evidence gaps ({gaps.length})</h2>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Control
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Severity
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Reason
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gaps.map((gap) => (
                <tr key={gap.controlId} className="hover:bg-muted/30">
                  <td className="px-4 py-2 text-xs">{gap.controlCode}</td>
                  <td className="px-4 py-2">{gap.controlTitle}</td>
                  <td className="px-4 py-2">
                    <StatusBadge {...severityStatus(gap.severity)} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {reasonLabel[gap.reason]}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/app/vault?control=${encodeURIComponent(gap.controlId)}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Attach evidence
                    </Link>
                  </td>
                </tr>
              ))}
              {gaps.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <CheckCircle2 className="mx-auto h-8 w-8 text-success opacity-50" />
                    <p className="mt-2 text-sm">
                      All controls have adequate evidence coverage.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
