import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutList, ShieldCheck } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  JourneyBoard,
  type JourneyItem,
  type JourneyStage,
} from '@/components/journey/JourneyBoard';
import { JourneySummary } from '@/components/journey/JourneySummary';

export const metadata = { title: 'Controls Journey | FormaOS' };

const STAGES: JourneyStage[] = [
  {
    key: 'non_compliant',
    label: 'Non-Compliant',
    tone: 'danger',
    description: 'Action required — evidence missing or failing.',
  },
  {
    key: 'at_risk',
    label: 'At Risk',
    tone: 'warning',
    description: 'Partial coverage — schedule a review.',
  },
  {
    key: 'compliant',
    label: 'Compliant',
    tone: 'success',
    description: 'Controls satisfied and attested.',
  },
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
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = Date.now();
  const diffDays = Math.round((now - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  const months = Math.round(diffDays / 30);
  return `${months}mo ago`;
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
      <div className="rounded-2xl border border-glass-border bg-glass-subtle p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass-subtle">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4 text-sm font-semibold">
          No controls provisioned yet
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable a compliance framework to populate the journey board.
        </p>
        <Link
          href="/app/compliance/frameworks"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          View Frameworks
        </Link>
      </div>
    );
  }

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

    const lowestScore =
      controls.reduce<number | null>(
        (min, x) =>
          x.compliance_score != null &&
          (min == null || x.compliance_score < min)
            ? x.compliance_score
            : min,
        null,
      ) ?? null;

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
        { label: 'Score', value: scoreLabel, tone: scoreTone(c.compliance_score) },
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
  const compliantPct = total > 0 ? Math.round((counts.compliant / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <JourneyBoard
          stages={STAGES}
          items={items}
          emptyLabel="No controls in this stage"
          realtime={{
            table: 'org_control_evaluations',
            orgColumn: 'organization_id',
            orgId,
          }}
        />
        <JourneySummary
          title="Framework coverage"
          description={`${total} controls across your enabled frameworks`}
          centerValue={`${compliantPct}%`}
          centerLabel="Compliant"
          segments={[
            {
              label: 'Compliant',
              value: counts.compliant ?? 0,
              tone: 'success',
            },
            { label: 'At Risk', value: counts.at_risk ?? 0, tone: 'warning' },
            {
              label: 'Non-Compliant',
              value: counts.non_compliant ?? 0,
              tone: 'danger',
            },
          ]}
        />
      </div>
    </div>
  );
}

export default async function ControlsJourneyPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Controls Journey</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pipeline view of every control flowing toward compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/controls"
            className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-glass-strong hover:text-foreground"
          >
            <LayoutList className="h-3.5 w-3.5" />
            List view
          </Link>
          <Link
            href="/app/compliance/frameworks"
            className="rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-glass-strong hover:text-foreground"
          >
            Frameworks
          </Link>
        </div>
      </div>

      <Suspense fallback={<SkeletonCard className="h-96" />}>
        <ControlsJourney orgId={state.organization.id} />
      </Suspense>
    </div>
  );
}
