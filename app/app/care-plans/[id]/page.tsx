import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  Edit,
  Copy,
  FileText,
  Target,
  Calendar,
  StickyNote,
  History,
  ChevronRight,
} from 'lucide-react';

export const metadata = { title: 'Care Plan Detail | FormaOS' };

export default async function CarePlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id } = await params;
  const db = await createSupabaseServerClient();

  const { data: plan } = await db
    .from('org_care_plans')
    .select('*, org_patients(id, first_name, last_name)')
    .eq('id', id)
    .eq('org_id', state.organization.id)
    .single();

  if (!plan) redirect('/app/care-plans');

  const { data: goals } = await db
    .from('org_care_goals')
    .select('*')
    .eq('care_plan_id', id)
    .eq('org_id', state.organization.id)
    .order('created_at', { ascending: true });

  const participant = plan.org_patients;
  const participantName = participant
    ? `${participant.first_name} ${participant.last_name}`
    : 'Unknown Participant';

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    review:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    archived: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  const goalStatusColors: Record<string, string> = {
    not_started: 'bg-gray-200 dark:bg-gray-700',
    in_progress: 'bg-blue-500',
    achieved: 'bg-green-500',
    partially_achieved: 'bg-yellow-500',
    discontinued: 'bg-red-400',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/care-plans"
          className="rounded-md p-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" data-testid="care-plan-title">
              {plan.title ?? 'Care Plan'}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[plan.status] ?? statusColors.draft}`}
            >
              {plan.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Participant: {participantName} · Created{' '}
            {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
            <Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Status Transitions */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <span className="text-sm font-medium text-muted-foreground">
          Transition:
        </span>
        {plan.status === 'draft' && (
          <StatusButton label="Activate" target="active" planId={id} />
        )}
        {plan.status === 'active' && (
          <>
            <StatusButton label="Mark for Review" target="review" planId={id} />
            <StatusButton label="Complete" target="completed" planId={id} />
          </>
        )}
        {plan.status === 'review' && (
          <>
            <StatusButton label="Re-activate" target="active" planId={id} />
            <StatusButton label="Complete" target="completed" planId={id} />
          </>
        )}
        {(plan.status === 'active' || plan.status === 'completed') && (
          <StatusButton
            label="Archive"
            target="archived"
            planId={id}
            variant="danger"
          />
        )}
      </div>

      {/* Tabs - Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Plan Overview */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-muted-foreground" /> Overview
            </h2>
            <div className="space-y-3 text-sm">
              <Detail
                label="Objectives"
                value={plan.objectives ?? 'Not specified'}
              />
              <Detail
                label="Risk Level"
                value={plan.risk_level ?? 'Standard'}
              />
              <Detail
                label="Support Needs"
                value={plan.support_needs ?? 'Not specified'}
              />
              <Detail
                label="Review Due"
                value={
                  plan.review_date
                    ? new Date(plan.review_date).toLocaleDateString()
                    : 'Not set'
                }
              />
            </div>
          </div>

          {/* Goals */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" /> Goals (
                {(goals ?? []).length})
              </h2>
              <button className="text-sm text-primary hover:underline">
                + Add Goal
              </button>
            </div>
            <div className="divide-y divide-border">
              {(goals ?? []).map((goal: Record<string, string | number>) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {goal.goal_text}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {(goal.category as string).replace(/_/g, ' ')} · Target:{' '}
                      {goal.target_date
                        ? new Date(
                            goal.target_date as string,
                          ).toLocaleDateString()
                        : 'No date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{goal.progress_percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${goalStatusColors[goal.status as string] ?? 'bg-gray-300'}`}
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {(goals ?? []).length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No goals added yet. Add goals to track participant progress.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Plan Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>
                  {plan.start_date
                    ? new Date(plan.start_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>
                  {plan.end_date
                    ? new Date(plan.end_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review Due</span>
                <span>
                  {plan.review_date
                    ? new Date(plan.review_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Created {new Date(plan.created_at).toLocaleDateString()}
              {plan.updated_at && plan.updated_at !== plan.created_at && (
                <> · Updated {new Date(plan.updated_at).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function StatusButton({
  label,
  target,
  planId,
  variant,
}: {
  label: string;
  target: string;
  planId: string;
  variant?: 'danger';
}) {
  return (
    <form action={`/api/v1/care-plans/${planId}/transition`} method="POST">
      <input type="hidden" name="status" value={target} />
      <button
        type="submit"
        className={`rounded-md px-3 py-1 text-xs font-medium ${
          variant === 'danger'
            ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950'
            : 'border border-border hover:bg-muted'
        }`}
      >
        {label}
      </button>
    </form>
  );
}
