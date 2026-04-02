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

export const metadata = { title: 'Evidence Gaps | FormaOS' };

export default async function EvidenceGapsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const [gaps, coverage, expiring, expired] = await Promise.all([
    identifyGaps(state.organization.id),
    calculateCoverage(state.organization.id),
    getExpiringEvidence(state.organization.id, 30),
    getExpiredEvidence(state.organization.id),
  ]);

  const criticalGaps = gaps.filter(
    (g) => g.severity === 'critical' || g.severity === 'high',
  );

  const severityColor: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const reasonLabel: Record<string, string> = {
    no_evidence: 'No evidence',
    expired_evidence: 'Evidence expired',
    needs_review: 'Needs review',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evidence Gap Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Identify controls without adequate evidence coverage.
          </p>
        </div>
        <Link
          href="/app/evidence"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Upload Evidence
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Coverage</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{coverage.coverage}%</p>
          <p className="text-xs text-muted-foreground">
            {coverage.coveredControls}/{coverage.totalControls} controls
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Total Gaps</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-red-500">{gaps.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Expiring Soon</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-yellow-500">
            {expiring.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Expired</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-red-500">
            {expired.length}
          </p>
        </div>
      </div>

      {/* Critical gaps */}
      {criticalGaps.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Critical & High Priority Gaps ({criticalGaps.length})
          </h2>
          <div className="space-y-2">
            {criticalGaps.slice(0, 10).map((gap) => (
              <div
                key={gap.controlId}
                className="flex items-center justify-between rounded bg-background/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {gap.controlCode}
                  </span>
                  <span className="text-sm">{gap.controlTitle}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${severityColor[gap.severity]}`}
                >
                  {reasonLabel[gap.reason]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All gaps table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">All Evidence Gaps ({gaps.length})</h2>
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
                  <td className="px-4 py-2 font-mono text-xs">
                    {gap.controlCode}
                  </td>
                  <td className="px-4 py-2">{gap.controlTitle}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${severityColor[gap.severity]}`}
                    >
                      {gap.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {reasonLabel[gap.reason]}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/app/evidence?control=${gap.controlId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Upload
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
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 opacity-50" />
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
  );
}
