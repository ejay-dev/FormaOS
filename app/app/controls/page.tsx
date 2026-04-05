import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  compliant: {
    label: 'Compliant',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    icon: CheckCircle2,
  },
  at_risk: {
    label: 'At Risk',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    icon: AlertTriangle,
  },
  non_compliant: {
    label: 'Non-Compliant',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
    icon: XCircle,
  },
};

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
      <div className="rounded-2xl border border-glass-border bg-glass-subtle p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass-subtle">
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
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = statusCounts[key as keyof typeof statusCounts] ?? 0;
          return (
            <div
              key={key}
              className="rounded-2xl border border-glass-border bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-5 shadow-premium-lg"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${config.className.split(' ').pop()}`}
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {config.label}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls table */}
      <div className="rounded-2xl border border-glass-border bg-glass-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-glass-border bg-glass-subtle text-muted-foreground">
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
            <tbody className="divide-y divide-glass-border">
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
                const cfg =
                  STATUS_CONFIG[control.status] ?? STATUS_CONFIG.at_risk;

                return (
                  <tr
                    key={control.id}
                    className="transition-colors hover:bg-glass-subtle"
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
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground">
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
  if (!state) redirect('/signin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Controls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and track compliance control evaluations across your frameworks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/compliance/frameworks"
            className="rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-glass-strong transition-colors"
          >
            Frameworks
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-glass-strong transition-colors"
          >
            Cross-Map
          </Link>
        </div>
      </div>

      <Suspense fallback={<SkeletonCard className="h-96" />}>
        <ControlsList orgId={state.organization.id} />
      </Suspense>
    </div>
  );
}
