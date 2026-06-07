import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutList, HeartPulse, Plus, GripVertical } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  type JourneyItem,
  type JourneyStage,
} from '@/components/journey/JourneyBoard';
import { CarePlansJourneyBoard } from '@/components/journey/CarePlansJourneyBoard';
import { JourneySegmentBar } from '@/components/journey/JourneySegmentBar';

export const metadata = { title: 'Care Plans Journey | FormaOS' };

const STAGES: JourneyStage[] = [
  { key: 'draft', label: 'Draft', tone: 'muted' },
  { key: 'active', label: 'Active', tone: 'success' },
  { key: 'under_review', label: 'Under Review', tone: 'info' },
  { key: 'expired', label: 'Expired', tone: 'danger' },
];

const PLAN_TYPE_LABEL: Record<string, string> = {
  support: 'Support',
  ndis: 'NDIS',
  chsp: 'CHSP',
  clinical: 'Clinical',
  behavioral: 'Behavioural',
};

type PlanRow = {
  id: string;
  plan_type: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  review_date: string | null;
  status: string;
  goals: unknown;
  client: { id: string; full_name: string | null } | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function reviewMeta(
  iso: string | null,
): { value: string; tone: 'success' | 'warning' | 'danger' | 'muted' } {
  const n = daysUntil(iso);
  if (n == null) return { value: '—', tone: 'muted' };
  if (n < 0) return { value: `${Math.abs(n)}d over`, tone: 'danger' };
  if (n <= 30) return { value: `${n}d`, tone: 'warning' };
  return { value: `${n}d`, tone: 'success' };
}

async function CarePlansJourney({ orgId }: { orgId: string }) {
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from('org_care_plans')
    .select(
      `id, plan_type, title, start_date, end_date, review_date, status, goals,
       client:client_id ( id, full_name )`,
    )
    .eq('organization_id', orgId)
    .order('review_date', { ascending: true, nullsFirst: false })
    .limit(300);

  const plans = ((data ?? []) as unknown as PlanRow[]).filter((p) =>
    STAGES.some((s) => s.key === p.status),
  );

  if (plans.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <HeartPulse className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-3 text-sm font-semibold">No care plans yet</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a plan to see it flow through the pipeline.
          </p>
          <Link
            href="/app/care-plans/new"
            className="min-h-[44px] md:min-h-0 mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3 w-3" />
            New Plan
          </Link>
        </div>
      </div>
    );
  }

  const reviewDueSoon = plans.filter((p) => {
    const n = daysUntil(p.review_date);
    return n != null && n >= 0 && n <= 14;
  }).length;
  const overdue = plans.filter((p) => {
    const n = daysUntil(p.review_date);
    return n != null && n < 0;
  }).length;

  const items: JourneyItem[] = plans.map((p) => {
    const clientName = p.client?.full_name ?? 'Unassigned';
    const goalsCount = Array.isArray(p.goals) ? p.goals.length : 0;
    const review = reviewMeta(p.review_date);

    return {
      id: p.id,
      stageKey: p.status,
      title: clientName,
      subtitle: p.title,
      accent: clientName,
      badge: {
        label: PLAN_TYPE_LABEL[p.plan_type] ?? p.plan_type,
        tone: 'info',
      },
      meta: [
        { label: 'Goals', value: String(goalsCount) },
        { label: 'Review', value: review.value, tone: review.tone },
      ],
      href: `/app/care-plans/${p.id}`,
      emphasise: review.tone === 'danger',
    };
  });

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = items.filter((i) => i.stageKey === s.key).length;
    return acc;
  }, {});

  const total = plans.length;
  const activePct = total > 0 ? Math.round((counts.active / total) * 100) : 0;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-[hsl(var(--card))]/60 px-4 py-2 sm:px-6">
        <h1 className="shrink-0 text-sm font-semibold tracking-tight">
          Care Plans Journey
        </h1>
        <span className="h-4 w-px bg-border" aria-hidden="true" />
        <JourneySegmentBar
          className="min-w-0 flex-1"
          segments={[
            {
              key: 'active',
              label: 'Active',
              value: counts.active ?? 0,
              tone: 'success',
            },
            {
              key: 'under_review',
              label: 'Review',
              value: counts.under_review ?? 0,
              tone: 'info',
            },
            {
              key: 'draft',
              label: 'Draft',
              value: counts.draft ?? 0,
              tone: 'muted',
            },
            {
              key: 'expired',
              label: 'Expired',
              value: counts.expired ?? 0,
              tone: 'danger',
            },
          ]}
        />
        <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:inline-flex">
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {activePct}%
            </span>{' '}
            active
          </span>
          {reviewDueSoon > 0 && (
            <span className="text-warning tabular-nums">
              {reviewDueSoon} due 14d
            </span>
          )}
          {overdue > 0 && (
            <span className="text-destructive tabular-nums">
              {overdue} overdue
            </span>
          )}
        </span>
        <span
          className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex"
          title="Drag cards to update status"
        >
          <GripVertical className="h-3 w-3" aria-hidden="true" />
          Drag to update
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/app/care-plans"
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LayoutList className="h-3 w-3" />
            List
          </Link>
          <Link
            href="/app/care-plans/new"
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3 w-3" />
            New
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <CarePlansJourneyBoard
          orgId={orgId}
          stages={STAGES}
          items={items}
          emptyLabel="None"
        />
      </div>
    </>
  );
}

export default async function CarePlansJourneyPage() {
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
        <CarePlansJourney orgId={state.organization.id} />
      </Suspense>
    </div>
  );
}
