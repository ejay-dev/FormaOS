import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutList, ShieldCheck, Radio } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  JourneyBoard,
  type JourneyItem,
  type JourneyStage,
} from '@/components/journey/JourneyBoard';
import { JourneySegmentBar } from '@/components/journey/JourneySegmentBar';

export const metadata = { title: 'Controls Journey | FormaOS' };

const STAGES: JourneyStage[] = [
  { key: 'non_compliant', label: 'Non-Compliant', tone: 'danger' },
  { key: 'at_risk', label: 'At Risk', tone: 'warning' },
  { key: 'compliant', label: 'Compliant', tone: 'success' },
];

type ControlRow = {
  id: string;
  control_key: string | null;
  status: string | null;
  compliance_score: number | null;
  last_evaluated_at: string | null;
  details: Record<string, unknown> | null;
  framework_id: string | null;
};

function scoreTone(score: number | null): 'success' | 'warning' | 'danger' {
  if (score == null) return 'warning';
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffDays = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 30) return `${diffDays}d`;
  const months = Math.round(diffDays / 30);
  return `${months}mo`;
}

async function ControlsJourney({ orgId }: { orgId: string }) {
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from('org_control_evaluations')
    .select(
      'id, control_key, status, compliance_score, last_evaluated_at, details, framework_id',
    )
    .eq('organization_id', orgId)
    .order('compliance_score', { ascending: true, nullsFirst: true });

  const controls = (data ?? []) as ControlRow[];

  if (controls.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface-1 p-6 text-center">
          <ShieldCheck className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-3 text-sm font-semibold">No controls yet</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enable a framework to populate the pipeline.
          </p>
          <Link
            href="/app/compliance/frameworks"
            className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            View Frameworks
          </Link>
        </div>
      </div>
    );
  }

  const lowestScore =
    controls.reduce<number | null>(
      (min, x) =>
        x.compliance_score != null && (min == null || x.compliance_score < min)
          ? x.compliance_score
          : min,
      null,
    ) ?? null;

  const items: JourneyItem[] = controls.map((c) => {
    const details = (c.details ?? {}) as Record<string, unknown>;
    const code =
      (details.control_code as string | undefined) ??
      c.control_key?.replace(/^control:/, '') ??
      c.id.slice(0, 6);
    const title = (details.control_title as string | undefined) ?? code;
    const frameworkCode =
      (details.framework_code as string | undefined) ?? '—';
    const stageKey = STAGES.find((s) => s.key === c.status)?.key ?? 'at_risk';
    const scoreLabel =
      c.compliance_score != null ? `${c.compliance_score}%` : '—';

    const emphasise =
      c.status === 'non_compliant' &&
      lowestScore != null &&
      c.compliance_score === lowestScore;

    return {
      id: c.id,
      stageKey,
      title: code,
      subtitle: title !== code ? title : undefined,
      accent: code,
      badge: { label: frameworkCode, tone: 'info' },
      meta: [
        {
          label: 'Score',
          value: scoreLabel,
          tone: scoreTone(c.compliance_score),
        },
        { label: 'Eval', value: formatRelativeDate(c.last_evaluated_at) },
      ],
      href: '/app/controls',
      emphasise,
    };
  });

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = items.filter((i) => i.stageKey === s.key).length;
    return acc;
  }, {});

  const total = controls.length;
  const compliantPct =
    total > 0 ? Math.round((counts.compliant / total) * 100) : 0;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2 sm:px-6">
        <h1 className="shrink-0 text-sm font-semibold tracking-tight">
          Controls Journey
        </h1>
        <span className="h-4 w-px bg-border" aria-hidden="true" />
        <JourneySegmentBar
          className="min-w-0 flex-1"
          segments={[
            {
              key: 'compliant',
              label: 'Compliant',
              value: counts.compliant ?? 0,
              tone: 'success',
            },
            {
              key: 'at_risk',
              label: 'At Risk',
              value: counts.at_risk ?? 0,
              tone: 'warning',
            },
            {
              key: 'non_compliant',
              label: 'Non-Compliant',
              value: counts.non_compliant ?? 0,
              tone: 'danger',
            },
          ]}
        />
        <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
          <span className="font-semibold tabular-nums text-foreground">
            {compliantPct}%
          </span>
          compliant · {total} total
        </span>
        <span
          className="hidden items-center gap-1 text-[10px] uppercase tracking-wider text-info sm:inline-flex"
          title="Live — updates stream from the evaluator"
        >
          <Radio className="h-3 w-3" />
          Live
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/app/controls"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-1 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <LayoutList className="h-3 w-3" />
            List
          </Link>
          <Link
            href="/app/compliance/frameworks"
            className="rounded-md border border-border bg-surface-1 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Frameworks
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <JourneyBoard
          stages={STAGES}
          items={items}
          emptyLabel="None"
          realtime={{
            table: 'org_control_evaluations',
            orgColumn: 'organization_id',
            orgId,
          }}
        />
      </div>
    </>
  );
}

export default async function ControlsJourneyPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  return (
    <div className="-mx-4 -my-4 flex h-[calc(100vh-6rem)] flex-col sm:-mx-6 sm:-my-6">
      <Suspense
        fallback={
          <div className="flex-1 p-4">
            <SkeletonCard className="h-full" />
          </div>
        }
      >
        <ControlsJourney orgId={state.organization.id} />
      </Suspense>
    </div>
  );
}
