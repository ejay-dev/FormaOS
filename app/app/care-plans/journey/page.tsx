import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutList, HeartPulse, Plus } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  type JourneyItem,
  type JourneyStage,
} from '@/components/journey/JourneyBoard';
import { CarePlansJourneyBoard } from '@/components/journey/CarePlansJourneyBoard';
import { JourneySummary } from '@/components/journey/JourneySummary';

export const metadata = { title: 'Care Plans Journey | FormaOS' };

const STAGES: JourneyStage[] = [
  {
    key: 'draft',
    label: 'Draft',
    tone: 'muted',
    description: 'In authoring — not yet active with the participant.',
  },
  {
    key: 'active',
    label: 'Active',
    tone: 'success',
    description: 'Plan in delivery with ongoing supports.',
  },
  {
    key: 'under_review',
    label: 'Under Review',
    tone: 'info',
    description: 'Plan being reassessed by the care team.',
  },
  {
    key: 'expired',
    label: 'Expired',
    tone: 'danger',
    description: 'Past end or review date — renewal needed.',
  },
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
  const d = new Date(iso);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function reviewMeta(
  iso: string | null,
): { value: string; tone: 'success' | 'warning' | 'danger' | 'muted' } {
  const n = daysUntil(iso);
  if (n == null) return { value: '—', tone: 'muted' };
  if (n < 0) return { value: `${Math.abs(n)}d over`, tone: 'danger' };
  if (n <= 14) return { value: `${n}d`, tone: 'warning' };
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
      <div className="rounded-2xl border border-glass-border bg-glass-subtle p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass-subtle">
          <HeartPulse className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4 text-sm font-semibold">No care plans yet</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a plan to see it flow through intake, delivery, and review.
        </p>
        <Link
          href="/app/care-plans/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Plan
        </Link>
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
    const urgent = p.status === 'under_review' || review.tone === 'danger';

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
      emphasise: urgent && review.tone === 'danger',
    };
  });

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = items.filter((i) => i.stageKey === s.key).length;
    return acc;
  }, {});

  const total = plans.length;
  const activePct = total > 0 ? Math.round((counts.active / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <CarePlansJourneyBoard
          orgId={orgId}
          stages={STAGES}
          items={items}
          emptyLabel="No plans in this stage"
        />
        <JourneySummary
          title="Care plan health"
          description={`${total} plans · ${reviewDueSoon} due in 14d · ${overdue} overdue`}
          centerValue={`${activePct}%`}
          centerLabel="Active"
          segments={[
            { label: 'Active', value: counts.active ?? 0, tone: 'success' },
            {
              label: 'Under Review',
              value: counts.under_review ?? 0,
              tone: 'info',
            },
            { label: 'Draft', value: counts.draft ?? 0, tone: 'muted' },
            { label: 'Expired', value: counts.expired ?? 0, tone: 'danger' },
          ]}
        />
      </div>
    </div>
  );
}

export default async function CarePlansJourneyPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Care Plans Journey</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pipeline view of every plan from intake to review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/care-plans"
            className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-glass-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-glass-strong hover:text-foreground"
          >
            <LayoutList className="h-3.5 w-3.5" />
            List view
          </Link>
          <Link
            href="/app/care-plans/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Plan
          </Link>
        </div>
      </div>

      <Suspense fallback={<SkeletonCard className="h-96" />}>
        <CarePlansJourney orgId={state.organization.id} />
      </Suspense>
    </div>
  );
}
