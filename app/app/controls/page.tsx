import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Workflow,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  RecordCard,
  RecordList,
} from '@/components/mobile/record-card';
import {
  StatusBadge,
  controlStatus,
} from '@/components/compliance/StatusBadge';

const SUMMARY_TILES = [
  { key: 'compliant', icon: CheckCircle2, toneClass: 'text-success' },
  { key: 'at_risk', icon: AlertTriangle, toneClass: 'text-warning' },
  { key: 'non_compliant', icon: XCircle, toneClass: 'text-destructive' },
] as const;

async function ControlsList({ orgId }: { orgId: string }) {
  const db = await createSupabaseServerClient();

  const { data: evaluations } = await db
    .from('org_control_evaluations')
    .select(
      'id, control_type, control_key, status, compliance_score, last_evaluated_at, details, framework_id',
    )
    .eq('organization_id', orgId)
    .order('status', { ascending: true });

  const controls = evaluations ?? [];

  if (controls.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4 text-sm font-semibold text-foreground">
          No controls provisioned yet
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Controls are created when you enable compliance frameworks during
          onboarding.
        </div>
        <Link
          href="/app/compliance/frameworks"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          View Frameworks
        </Link>
      </div>
    );
  }

  const statusCounts = {
    compliant: controls.filter((c) => c.status === 'compliant').length,
    at_risk: controls.filter((c) => c.status === 'at_risk').length,
    non_compliant: controls.filter((c) => c.status === 'non_compliant').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SUMMARY_TILES.map((tile) => {
          const Icon = tile.icon;
          const count = statusCounts[tile.key] ?? 0;
          return (
            <div
              key={tile.key}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${tile.toneClass}`} />
                <span className="text-xs font-semibold text-muted-foreground">
                  {controlStatus(tile.key).label}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <RecordList>
          {controls.map((control) => {
            const details = (control.details ?? {}) as Record<string, unknown>;
            const controlCode =
              (details.control_code as string) ??
              control.control_key?.replace('control:', '') ??
              '—';
            const controlTitle =
              (details.control_title as string) ?? controlCode;
            const frameworkCode =
              (details.framework_code as string) ?? '—';
            return (
              <RecordCard
                key={control.id}
                title={controlCode}
                subtitle={controlTitle !== controlCode ? controlTitle : undefined}
                status={<StatusBadge {...controlStatus(control.status)} />}
                meta={[
                  { label: 'Framework', value: frameworkCode },
                  {
                    label: 'Score',
                    value:
                      control.compliance_score != null
                        ? `${control.compliance_score}%`
                        : '—',
                  },
                  {
                    label: 'Evaluated',
                    value: control.last_evaluated_at
                      ? new Date(
                          control.last_evaluated_at,
                        ).toLocaleDateString()
                      : 'Not evaluated',
                  },
                ]}
              />
            );
          })}
        </RecordList>
      </div>

      {/* Controls table — desktop */}
      <div className="hidden md:block rounded-xl border border-border bg-surface-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Control</th>
                <th className="px-4 py-3 text-left font-medium">Framework</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Score</th>
                <th className="px-4 py-3 text-left font-medium">
                  Last Evaluated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {controls.map((control) => {
                const details = (control.details ?? {}) as Record<
                  string,
                  unknown
                >;
                const controlCode =
                  (details.control_code as string) ??
                  control.control_key?.replace('control:', '') ??
                  '—';
                const controlTitle =
                  (details.control_title as string) ?? controlCode;
                const frameworkCode = (details.framework_code as string) ?? '—';

                return (
                  <tr
                    key={control.id}
                    className="transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {controlCode}
                      </div>
                      {controlTitle !== controlCode && (
                        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {controlTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs uppercase">
                        {frameworkCode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge {...controlStatus(control.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs tabular-nums text-foreground">
                        {control.compliance_score != null
                          ? `${control.compliance_score}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {control.last_evaluated_at
                          ? new Date(
                              control.last_evaluated_at,
                            ).toLocaleDateString()
                          : 'Not evaluated'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default async function ControlsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Controls</h1>
          <p className="page-description">
            Controls are provisioned from your activated frameworks. Add or
            update them in the{' '}
            <Link
              href="/app/compliance/frameworks"
              className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
            >
              Framework Library
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/controls/journey"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
          >
            <Workflow className="h-3.5 w-3.5" />
            Journey view
          </Link>
          <Link
            href="/app/compliance/frameworks"
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            Frameworks
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            Cross-map
          </Link>
        </div>
      </div>

      <div className="page-content">
        <Suspense fallback={<SkeletonCard className="h-96" />}>
          <ControlsList orgId={state.organization.id} />
        </Suspense>
      </div>
    </div>
  );
}
